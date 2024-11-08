# Generate Images

To generate images for listing, run the following command:

```bash
npm run generate-images -- --product="<product>" --theme="<theme>" --style="<style>" --keywords="<keyword1, keyword2>" --limit=5 --exists=true
```

Options:
| Option | Values | Required |
| ------ | ----- | ----- |
| product | 'desk mat', 'sleeve' | true |
| theme | string | false |
| style | string | false |
| keywords | keyword1, keyword2 | false |
| limit | number (default 5) | false |
| exists | true, false | false |

If the exists flag is set to true, the script will not generate images from Dalle-E. It will process the images that exist in the rescale folder. After it has processed the images, it will remove the file from the folder.

# Generate the mock up images

Review the images that have been generated. Make adjustments to the images as needed. Once approved, open Photoshop and run script:

File > Scripts > Browse > select the script file (desk-mat-mockup.jsx or laptop-sleeve-mockup.jsx)

# Generate the Listing

To generate a listing, run the following command:

```bash
npm run generate-listings -- --product="<product>" --limit=5
```

This will upload the images to Printify and generate a listing for the product.

# Manually Review Uploaded Images

Navigate to the Printify Dashboard and review the uploaded images. Remove the default images from the mockup library and add the generated mockup + some defaults.

The title can be replaced with better SEO friendly titles.

Validate the description and make sure it is accurate.

Set the shipping profile.

Publish the listing. For the next steps to work the status of the listing must be published.

# Etsy Auth

Start the auth server with the following command:

```bash
npm run auth-server
```

navigate to `http://localhost:3000` in your browser to view the auth server. Click the hyperlink and follow sign in instructions.

The access token should be returned in the console. Use this for API endpoints that require Oauth authentication.

Replace the ETSY_ACCESS_TOKEN in the .env file with the returned refresh token.

# Update Etsy Listing

To update a listing, run the following command:

```bash
npm run update-etsy -- --product="<product>"
```

This will update the listing with the tags, materials, auto renew and production partner. Prices and core details will still need manual updates.
