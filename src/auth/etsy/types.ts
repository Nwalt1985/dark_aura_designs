/**
 * Etsy Authentication Types Module
 *
 * This module defines types and type guards for Etsy OAuth authentication.
 * It includes the TokenResponse interface for Etsy OAuth token responses
 * and a type guard function to validate token responses.
 */

/**
 * Interface representing an OAuth token response from Etsy
 *
 * @property access_token - The OAuth access token for API requests
 * @property refresh_token - The refresh token used to obtain new access tokens
 * @property expires_in - The number of seconds until the access token expires
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Type guard to validate if an unknown object is a valid TokenResponse
 *
 * @param data - The data to validate
 * @returns True if the data is a valid TokenResponse, false otherwise
 */
export function isTokenResponse(data: unknown): data is TokenResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'access_token' in data &&
    'refresh_token' in data &&
    'expires_in' in data &&
    typeof (data as TokenResponse).access_token === 'string' &&
    typeof (data as TokenResponse).refresh_token === 'string' &&
    typeof (data as TokenResponse).expires_in === 'number'
  );
}
