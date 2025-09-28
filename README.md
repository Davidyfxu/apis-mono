# Cloudflare Workers API - Reports Management System

A Cloudflare Worker-based API built with OpenAPI 3.1, Hono, and Drizzle ORM for managing reports with file upload/download capabilities.

## Features

- **OpenAPI 3.1 Compliant**: Automatic OpenAPI schema generation with [chanfana](https://github.com/cloudflare/chanfana)
- **RESTful API**: Full CRUD operations for reports management
- **File Handling**: Upload and download files with R2 storage
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List all reports |
| POST | `/api/reports` | Create a new report |
| GET | `/api/reports/:reportId` | Get specific report |
| DELETE | `/api/reports/:reportId` | Delete a report |
| POST | `/api/reports/upload` | Upload report files |
| GET | `/api/reports/:reportId/download/:fileType` | Download report files |
| GET | `/api/reports/:reportId/file/:fileType` | Direct file download |

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
   npm install
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Setup database (local development):**
   ```bash
   npm run db:local
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the API:**
   - OpenAPI Documentation: http://localhost:8787/
   - Test endpoint: http://localhost:8787/test

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
│   ├── reportCreate.ts
│   ├── reportDelete.ts
│   ├── reportFetch.ts
│   ├── reportList.ts
│   ├── reportFileUpload.ts
│   ├── reportFileDownload.ts
│   └── reportFileDirectDownload.ts
└── utils/
    └── index.ts          # Utility functions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run deploy` - Deploy to production
- `npm run start` - Start with production environment
- `npm run cf-typegen` - Generate Cloudflare types
- `npm run db:local` - Apply database migrations locally
- `npm run db:setup` - Setup database for both local and production

### Environment Configuration

The project uses Cloudflare Workers bindings:
- `DB` - D1 database for reports
- `REPORTS_BUCKET` - R2 bucket for file storage
- `DOWNLOAD_SECRET` - Secret for secure file downloads

## Database Schema

The application uses the following database schema:

- **reports** table: Stores report metadata
- **report_files** table: Manages file attachments

## File Handling

Files are stored in Cloudflare R2 with the following features:
- Secure upload with validation
- Direct download URLs with authentication
- File type categorization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

## License

This project is licensed under the MIT License.
