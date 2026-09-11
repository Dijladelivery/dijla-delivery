const Database = require("better-sqlite3");

const db = new Database("dijla-delivery.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trackingCode TEXT UNIQUE NOT NULL,
        sender TEXT,
        receiver TEXT,
        origin TEXT,
        destination TEXT,
        status TEXT,
        estimatedDelivery TEXT,
        currentLocation TEXT,
        latitude REAL,
        longitude REAL
    )
`).run();

console.log("DIJLA DELIVERY database is ready.");

db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        message TEXT NOT NULL,
        trackingCode TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

console.log("DIJLA DELIVERY chat database is ready.");
module.exports = db;