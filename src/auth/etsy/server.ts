/**
 * Etsy OAuth Server Module
 *
 * This module implements an Express server that handles the OAuth 2.0
 * authorization code flow for Etsy API authentication. It includes:
 *
 * - An Express server that listens on port 3003
 * - Routes for initiating the OAuth flow and handling the redirect
 * - Functions for generating the PKCE code challenge
 * - Error handling for the OAuth process
 *
 * The server stores the obtained access and refresh tokens in the database
 * for later use by the application.
 */
import express from 'express';
import dotenv from 'dotenv';
import crypto, { BinaryLike } from 'crypto';
import { updateEtsyAuthCredentials } from '../../service/db';
import { isTokenResponse } from './types';
import { ExternalServiceError, Logger, handleError } from '../../errors';

/**
 * Interface for the result of the code challenge generation
 *
 * @property codeChallenge - The SHA-256 hash of the code verifier
 * @property codeVerifier - The random string used to generate the code challenge
 * @property state - A random state value for CSRF protection
 * @property fullUrl - The complete OAuth authorization URL
 */
interface CodeChallengeResult {
  codeChallenge: string;
  codeVerifier: string;
  state: string;
  fullUrl: string;
}

/**
 * Interface for Etsy API error responses
 *
 * @property error - The error code or message
 * @property error_description - Optional detailed error description
 */
interface EtsyErrorResponse {
  error: string;
  error_description?: string;
}

dotenv.config();

// Create a new express application
const app = express();

const challenge = codeChallenge();
Logger.info('Code challenge generated');

app.set('view engine', 'hbs');
app.set('views', `${process.cwd()}/src/auth/etsy/views`);

// This renders our `index.hbs` file.
app.get('/', (_req, res) => {
  res.render('index', {
    title: 'Etsy OAuth',
    fullUrl: challenge.fullUrl,
  });
});

/**
 * Ping endpoint to test connectivity with the Etsy API
 * Sends a request to Etsy's openapi-ping endpoint and returns the response
 */
app.get('/ping', async (_req, res) => {
  const requestOptions = {
    method: 'GET',
    headers: {
      'x-api-key': process.env['ETSY_KEY_STRING'] || '',
    },
  };

  const response = await fetch('https://api.etsy.com/v3/application/openapi-ping', requestOptions);

  if (response.ok) {
    const data = await response.json();
    res.send(data);
  } else {
    res.send(response.statusText);
  }
});

const clientID = process.env['ETSY_KEY_STRING'];
const clientVerifier = challenge.codeVerifier;
const redirectUri = 'http://localhost:3003/oauth/redirect';

/**
 * OAuth redirect endpoint that handles the authorization code callback
 * Exchanges the authorization code for access and refresh tokens,
 * then stores them in the database
 */
app.get('/oauth/redirect', async (req, res) => {
  try {
    const authCode = req.query['code'] as string;
    if (!authCode) {
      throw new ExternalServiceError('No authorization code provided by Etsy');
    }

    const tokenUrl = 'https://api.etsy.com/v3/public/oauth/token';

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientID,
        redirect_uri: redirectUri,
        code: authCode,
        code_verifier: clientVerifier,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(tokenUrl, requestOptions);

    if (response.ok) {
      const data = await response.json();
      if (!isTokenResponse(data)) {
        throw new ExternalServiceError('Invalid token response from Etsy');
      }

      Logger.info('Token data received');

      try {
        await updateEtsyAuthCredentials({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        });

        res.send(
          'Authentication successful! You can close this window and return to the application.',
        );
      } catch (dbError) {
        Logger.error(handleError(dbError));
        res
          .status(500)
          .send('Authentication successful, but failed to save credentials. Please try again.');
      }
    } else {
      const errorData = (await response.json()) as EtsyErrorResponse;
      throw new ExternalServiceError('Failed to get Etsy token', errorData);
    }
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    res.status(handledError.code).json(handledError);
  }
});

// Start the server on port 3003
const port = 3003;

app.listen(port, () => {
  Logger.info(`Server listening at http://localhost:${port}`);
});

/**
 * Generates a code challenge for PKCE (Proof Key for Code Exchange)
 *
 * This function creates a random code verifier and its corresponding
 * code challenge using the SHA-256 algorithm. It also generates a
 * random state value and constructs the full OAuth authorization URL.
 *
 * @returns An object containing the code challenge, verifier, state, and full URL
 */
function codeChallenge(): CodeChallengeResult {
  // The next two functions help us generate the code challenge
  // required by Etsy's OAuth implementation.
  const base64URLEncode = (str: Buffer): string =>
    str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const sha256 = (buffer: BinaryLike): Buffer =>
    crypto.createHash('sha256').update(buffer).digest();

  // We'll use the verifier to generate the challenge.
  // The verifier needs to be saved for a future step in the OAuth flow.
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));

  // With these functions, we can generate
  // the values needed for our OAuth authorization grant.
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  const state = Math.random().toString(36).substring(7);
  const clientId = process.env['ETSY_KEY_STRING'];
  const fullUrl = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3003/oauth/redirect&scope=listings_w%20listings_r&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return {
    codeChallenge,
    codeVerifier,
    state,
    fullUrl,
  };
}
