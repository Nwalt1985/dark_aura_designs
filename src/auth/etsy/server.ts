import express from 'express';
import dotenv from 'dotenv';
import hbs from 'hbs';
import crypto from 'crypto';
import { access } from 'fs';

dotenv.config();

// Create a new express application
const app = express();

const challenge = codeChallenge();
console.log(challenge);

app.set('view engine', 'hbs');
app.set('views', `${process.cwd()}/src/auth/etsy/views`);

// This renders our `index.hbs` file.
app.get('/', async (req, res) => {
  res.render('index', {
    fullUrl: challenge.fullUrl,
  });
});

// Send a "Hello World!" response to a default get request
app.get('/ping', async (req, res) => {
  const requestOptions = {
    method: 'GET',
    headers: {
      'x-api-key': process.env.ETSY_KEY_STRING || '',
    },
  };

  const response = await fetch(
    'https://api.etsy.com/v3/application/openapi-ping',
    requestOptions,
  );

  if (response.ok) {
    const data = await response.json();
    res.send(data);
  } else {
    res.send(response.statusText);
  }
});

const clientID = process.env.ETSY_KEY_STRING;
const clientVerifier = challenge.codeVerifier;
const redirectUri = 'http://localhost:3003/oauth/redirect';

app.get('/oauth/redirect', async (req, res) => {
  // The req.query object has the query params that Etsy authentication sends
  // to this route. The authorization code is in the `code` param
  const authCode = req.query.code;
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

  // Extract the access token from the response access_token data field
  if (response.ok) {
    const tokenData = (await response.json()) as any;

    const urlencoded = new URLSearchParams();

    urlencoded.append('grant_type', 'refresh_token');
    urlencoded.append('client_id', clientID as string);
    urlencoded.append('refresh_token', tokenData.refresh_token as string);

    const refreshRequestOptions = {
      method: 'POST',
      body: urlencoded,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const refreshUrl = `https://api.etsy.com/v3/public/oauth/token`;

    const refreshResponse = await fetch(refreshUrl, refreshRequestOptions);

    if (refreshResponse.ok) {
      const refreshData = (await refreshResponse.json()) as any;

      console.log('Data:', {
        refreshData,
      });
    } else {
      await logError(response);
    }
  } else {
    await logError(response);
  }
});

// Start the server on port 3003
const port = 3003;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

function codeChallenge() {
  // The next two functions help us generate the code challenge
  // required by Etsy’s OAuth implementation.
  const base64URLEncode = (str: any) =>
    str
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

  const sha256 = (buffer: Buffer) =>
    crypto.createHash('sha256').update(buffer).digest();

  // We’ll use the verifier to generate the challenge.
  // The verifier needs to be saved for a future step in the OAuth flow.
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));

  // With these functions, we can generate
  // the values needed for our OAuth authorization grant.
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  const state = Math.random().toString(36).substring(7);
  const clientId = process.env.ETSY_KEY_STRING;
  const fullUrl = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3003/oauth/redirect&scope=listings_w&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return {
    codeChallenge,
    codeVerifier,
    state,
    fullUrl,
  };
}

async function logError(response: any) {
  // Log http status to the console
  console.log(response.status, response.statusText);

  // For non-500 errors, the endpoints return a JSON object as an error response
  const errorData = await response.json();
  console.log(errorData);
  return errorData;
}
