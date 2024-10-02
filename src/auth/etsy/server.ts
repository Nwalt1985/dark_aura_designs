import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Create a new express application
const app = express();

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

// Start the server on port 3003
const port = 3003;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
