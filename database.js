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
const columns = db.prepare("PRAGMA table_info(messages)").all();

if (!columns.some(column => column.name === "customerId")) {
    db.prepare("ALTER TABLE messages ADD COLUMN customerId TEXT").run();
}

console.log("DIJLA DELIVERY chat database is ready.");
module.exports = db;