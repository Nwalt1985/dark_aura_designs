# Dark Aura Designs

This repository contains scripts for automating the creation and management of product listings across multiple marketplaces.

## Generate Images

To generate images for a product listing, run the following command:

```bash
npm run generate-images -- --product="<product>" --marketplace="<marketplace>" --limit=10
```

Options:
| Option | Values | Required |
| ------ | ------ | -------- |
| product | 'desk mat', 'pillow', 'blanket', 'woven' | true |
| marketplace | 'Etsy', 'Shopify' | true |
| limit | number (default 10) | false |

### Generate All Images at Once

To generate images for all products for Etsy:

```bash
npm run generate-all-rescale-etsy
```

To generate images for all products for Shopify:

```bash
npm run generate-all-rescale-shopify
```

## Generate Listings

After reviewing and approving the generated images, you can create listings with:

```bash
npm run generate-listings -- --product="<product>" --marketplace="<marketplace>" --limit=10
```

Options:
| Option | Values | Required |
| ------ | ------ | -------- |
| product | 'desk mat', 'pillow', 'blanket', 'woven' | true |
| marketplace | 'Etsy', 'Shopify' | true |
| limit | number (default 10) | false |

### Generate All Listings at Once

To generate listings for all products for Etsy:

```bash
npm run generate-all-listings-etsy
```

To generate listings for all products for Shopify:

```bash
npm run generate-all-listings-shopify
```

## Manually Review Uploaded Images

Navigate to the Printify Dashboard and review the uploaded images:

1. Remove the default images from the mockup library
2. Add the generated mockup + some defaults
3. Update the title with SEO-friendly text
4. Validate the description for accuracy
5. Set the shipping profile
6. Publish the listing (must be published for the next steps to work)

## Etsy Authentication

Start the auth server with:

```bash
npm run auth-server
```

Navigate to `http://localhost:3003` in your browser. Click the hyperlink and follow the sign-in instructions.

The access token will be returned in the console and stored in the database. It will be automatically used for any API endpoints requiring OAuth authentication.

Stop the auth server with:

```bash
ctrl + c
```

## Update Etsy Listing

To update a listing with tags, materials, auto-renew settings, and production partner information:

```bash
npm run update-etsy -- --product="<product>" --limit=25
```

Options:
| Option | Values | Required |
| ------ | ------ | -------- |
| product | 'desk mat', 'pillow', 'blanket', 'woven' | true |
| limit | number (default 25) | false |

### Update All Listings at Once

To update all product listings on Etsy:

```bash
npm run update-all
```

Note: Prices and core details will still need manual updates.

## Development

### Testing

```bash
# Run tests with type checking disabled (faster)
npm test

# Run tests with type checking enabled
npm run test:typecheck

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

The project uses Jest for testing. Tests are located in the `src/__tests__` directory, organized to mirror the structure of the source code.

#### Test Structure

- `src/__tests__/handlers/` - Tests for handler functions
- `src/__tests__/service/` - Tests for service modules
- `src/__tests__/database/` - Tests for database operations
- `src/__tests__/errors/` - Tests for error handling

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck

# Format code
npm run format

# Run all checks
npm run check
```
