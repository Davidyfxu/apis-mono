-- Migration: Create gold_prices table
-- Created: 2025-10-29

CREATE TABLE IF NOT EXISTS gold_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp BIGINT NOT NULL,
    price REAL NOT NULL,
    change_percentage REAL NOT NULL,
    change REAL NOT NULL,
    open REAL NOT NULL,
    high REAL NOT NULL,
    low REAL NOT NULL,
    prev REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_gold_prices_timestamp ON gold_prices(timestamp);
CREATE INDEX IF NOT EXISTS idx_gold_prices_created_at ON gold_prices(created_at);

