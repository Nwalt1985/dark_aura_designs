export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

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
