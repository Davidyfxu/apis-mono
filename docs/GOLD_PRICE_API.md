# Gold Price API Documentation

## Overview

This API fetches gold prices from the Gold API and stores them in the database.

## Database Schema

Table: `gold_prices`

- `id` - Auto-incrementing primary key
- `timestamp` - API timestamp (Unix milliseconds)
- `price` - Current gold price (CNY/gram)
- `change_percentage` - Percentage change
- `change` - Absolute change
- `open` - Opening price
- `high` - Highest price
- `low` - Lowest price
- `prev` - Previous close price
- `created_at` - Record creation timestamp

## Endpoints

### 1. Fetch and Store Gold Price

**POST** `/api/gold/fetch`

Fetches the current gold price from the Gold API and stores it in the database.

**Response:**

```json
{
  "success": true,
  "message": "Gold price fetched and stored successfully",
  "data": {
    "id": 1,
    "timestamp": 1761718305405,
    "price": 905.63505,
    "change_percentage": 0.29984,
    "change": 2.70732,
    "open": 902.92774,
    "high": 908.98766,
    "low": 891.96737,
    "prev": 902.25555,
    "created_at": "2025-10-29 12:00:00"
  }
}
```

### 2. List Gold Prices

**GET** `/api/gold/list?limit=10`

Retrieves stored gold prices from the database.

**Query Parameters:**

- `limit` (optional, default: 10, max: 100) - Number of records to return

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": 1761718305405,
      "price": 905.63505,
      "change_percentage": 0.29984,
      "change": 2.70732,
      "open": 902.92774,
      "high": 908.98766,
      "low": 891.96737,
      "prev": 902.25555,
      "created_at": "2025-10-29 12:00:00"
    }
  ],
  "count": 1
}
```

## Setup Instructions

### 1. Run Database Migrations

For local development:

```bash
npm run db:local
```

For production:

```bash
npm run db:prod
```

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Test the API

Fetch gold price:

```bash
curl -X POST http://localhost:8787/api/gold/fetch
```

List gold prices:

```bash
curl http://localhost:8787/api/gold/list?limit=5
```

## API Source

Gold prices are fetched from: https://gold.g.apised.com/v1/latest

- Base currency: CNY
- Metal: XAU (Gold)
- Weight unit: gram
