# Cloudflare Workers API - Mono Repository

A Cloudflare Worker-based API built with OpenAPI 3.1, Hono, and Drizzle ORM. Currently includes Gold Price API and Email utilities.

## Features

- **OpenAPI 3.1 Compliant**: Automatic OpenAPI schema generation with [chanfana](https://github.com/cloudflare/chanfana)
- **RESTful API**: Well-structured API endpoints
- **Gold Price Integration**: Fetch and store gold prices from external API
- **Email Service**: Complete email sending functionality with nodemailer
- **Database Integration**: SQLite with D1 database using Drizzle ORM
- **TypeScript**: Fully typed with Cloudflare Workers TypeScript support

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: [Hono](https://hono.dev/) - Fast, lightweight web framework
- **OpenAPI**: [chanfana](https://github.com/cloudflare/chanfana) - OpenAPI 3.1 schema generation
- **Database**: Cloudflare D1 (SQLite) with [Drizzle ORM](https://orm.drizzle.team/)
- **Storage**: Cloudflare R2 for file storage
- **Validation**: Zod schema validation

## API Endpoints

### Gold Price API

| Method | Endpoint          | Description                        |
| ------ | ----------------- | ---------------------------------- |
| POST   | `/api/gold/fetch` | Fetch and store current gold price |
| GET    | `/api/gold/list`  | List stored gold prices            |

### Email API

| Method | Endpoint            | Description                |
| ------ | ------------------- | -------------------------- |
| POST   | `/api/email/test`   | Send test email            |
| GET    | `/api/email/verify` | Verify email configuration |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd apis-mono
   pnpm install
   ```

2. **Login to Cloudflare:**

   ```bash
   wrangler login
   ```

3. **Setup database (local development):**

   ```bash
   pnpm run db:local
   ```

4. **Start development server:**

   ```bash
   pnpm run dev
   ```

5. **Access the API:**
   - OpenAPI Documentation: http://localhost:8787/
   - Test endpoint: http://localhost:8787/test

### Quick Test

**Test Gold Price API:**

```bash
# Fetch current gold price
curl -X POST http://localhost:8787/api/gold/fetch

# List stored prices
curl http://localhost:8787/api/gold/list?limit=5
```

**Test Email API:**

```bash
# Verify email configuration
curl http://localhost:8787/api/email/verify

# Send test email
curl -X POST http://localhost:8787/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "type": "text",
    "content": "This is a test email"
  }'
```

### Deployment

1. **Setup production database:**

   ```bash
   npm run db:setup
   ```

2. **Deploy to Cloudflare Workers:**
   ```bash
   npm run deploy
   ```

## Project Structure

```
src/
├── index.ts              # Main application entry point
├── types.ts              # TypeScript type definitions
├── db/
│   ├── index.ts          # Database configuration
│   └── schema.ts         # Database schema definitions
├── endpoints/            # API endpoint handlers
│   ├── goldPriceFetch.ts # Fetch and store gold prices
│   ├── goldPriceList.ts  # List gold prices
│   └── emailTest.ts      # Email testing endpoints
├── utils/
│   ├── index.ts          # Utility functions
│   └── email.ts          # Email sending utilities
├── migrations/           # Database migrations
│   └── 0001_create_gold_prices_table.sql
├── docs/                 # Documentation
│   ├── GOLD_PRICE_API.md
│   └── EMAIL_UTILS.md
└── examples/             # Usage examples
    └── email-usage.ts
```

## Development

### Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run deploy` - Deploy to production
- `pnpm run start` - Start with production environment
- `pnpm run cf-typegen` - Generate Cloudflare types
- `pnpm run db:local` - Apply database migrations locally
- `pnpm run db:prod` - Apply database migrations to production
- `pnpm run db:setup` - Setup database for both local and production

### Environment Configuration

The project uses Cloudflare Workers bindings:

- `DB` - D1 database (api_mono_db)
- `REPORTS_BUCKET` - R2 bucket for file storage
- `DOWNLOAD_SECRET` - Secret for secure file downloads
- `GOLD_API_KEY` - API key for Gold price service

## Database Schema

### Gold Prices Table

Stores gold price data fetched from external API:

- `id` - Primary key
- `timestamp` - API timestamp
- `price` - Current gold price (CNY/gram)
- `change_percentage` - Percentage change
- `change` - Absolute change
- `open` - Opening price
- `high` - Highest price
- `low` - Lowest price
- `prev` - Previous close price
- `created_at` - Record creation timestamp

## Email Service

The project includes a complete email sending utility using nodemailer with the following features:

- **SMTP Configuration**: Uses smtp.yeah.net
- **Multiple Send Methods**: Text, HTML, and notification templates
- **Attachments Support**: Send files with emails
- **Multiple Recipients**: Support for to, cc, and bcc
- **Email Verification**: Built-in configuration verification

See [docs/EMAIL_UTILS.md](docs/EMAIL_UTILS.md) for detailed documentation.

## Documentation

- **[Gold Price API](docs/GOLD_PRICE_API.md)** - Complete gold price API documentation
- **[Email Utils](docs/EMAIL_UTILS.md)** - Email service usage guide
- **[Email Examples](examples/email-usage.ts)** - Practical email usage examples

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

## License

This project is licensed under the MIT License.
