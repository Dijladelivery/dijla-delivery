const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 3000;

// Get all packages from the database
function getPackages() {
    const rows = db.prepare("SELECT * FROM packages").all();

    const packages = {};

    for (const pkg of rows) {
        packages[pkg.trackingCode] = pkg;
    }

    return packages;
}

// Save packages to the database
function savePackages(packages) {
    const insert = db.prepare(`
        INSERT OR REPLACE INTO packages (
            trackingCode,
            sender,
            receiver,
            origin,
            destination,
            status,
            estimatedDelivery,
            currentLocation,
            latitude,
            longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

    const saveMany = db.transaction((packages) => {
        for (const pkg of Object.values(packages)) {
            insert.run(
                pkg.trackingCode,
                pkg.sender,
                pkg.receiver,
                pkg.origin,
                pkg.destination,
                pkg.status,
                pkg.estimatedDelivery || null,
                pkg.currentLocation,
                pkg.latitude || null,
                pkg.longitude || null
            );
        }
    });

    saveMany(packages);
}

app.use(express.json());
app.use(express.static(__dirname));

app.get("/track/:code", (req, res) => {
    const code = req.params.code.toUpperCase();
    const packages = getPackages();

    if (packages[code]) {
        res.json(packages[code]);
    } else {
        res.status(404).json({
            message: "Tracking code not found."
        });
    }
});

app.post("/api/packages", (req, res) => {
    const packages = getPackages();

    const code = req.body.trackingCode.toUpperCase();

    if (packages[code]) {
        return res.status(400).json({
            message: "This tracking code already exists."
        });
    }

    packages[code] = {
        trackingCode: code,
        sender: req.body.sender,
        receiver: req.body.receiver,
        origin: req.body.origin,
        destination: req.body.destination,
        currentLocation: req.body.currentLocation,
        status: req.body.status,
        estimatedDelivery: req.body.estimatedDelivery || null,
        latitude: req.body.latitude || null,
        longitude: req.body.longitude || null,
    };

    savePackages(packages);

    res.json({
        message: "Shipment created successfully!"
    });
});

app.get("/api/packages", (req, res) => {
    const packages = getPackages();
    res.json(packages);
});
app.put("/api/packages/:code", (req, res) => {
    const packages = getPackages();

    const code = req.params.code.toUpperCase();

    if (!packages[code]) {
        return res.status(404).json({
            message: "Shipment not found."
        });
    }

    packages[code] = {
        ...packages[code],
        sender: req.body.sender ?? packages[code].sender,
        receiver: req.body.receiver ?? packages[code].receiver,
        origin: req.body.origin ?? packages[code].origin,
        destination: req.body.destination ?? packages[code].destination,
        currentLocation: req.body.currentLocation ?? packages[code].currentLocation,
        status: req.body.status ?? packages[code].status,
        estimatedDelivery: req.body.estimatedDelivery ?? packages[code].estimatedDelivery,
        latitude: req.body.latitude ?? packages[code].latitude,
        longitude: req.body.longitude ?? packages[code].longitude
    };

    savePackages(packages);

    res.json({
        message: "Shipment updated successfully!"
    });
});

// ==================== ONLINE SUPPORT CHAT ====================

app.post("/api/chat", (req, res) => {
    const { sender, message, trackingCode } = req.body;

    if (!sender || !message) {
        return res.status(400).json({
            message: "Sender and message are required."
        });
    }

    const stmt = db.prepare(`
        INSERT INTO messages (sender, message, trackingCode)
        VALUES (?, ?, ?)
    `);

    stmt.run(
        sender,
        message,
        trackingCode || null
    );

    res.json({
        message: "Message sent successfully!"
    });
});
app.get("/api/chat", (req, res) => {
    const messages = db.prepare(`
        SELECT *
        FROM messages
        ORDER BY createdAt ASC
    `).all();

    res.json(messages);
});
app.post("/api/chat/reply", (req, res) => {
    const { message, trackingCode } = req.body;

    if (!message) {
        return res.status(400).json({
            message: "Reply message is required."
        });
    }

    const stmt = db.prepare(`
        INSERT INTO messages (sender, message, trackingCode)
        VALUES (?, ?, ?)
    `);

    stmt.run(
        "Admin",
        message,
        trackingCode || null
    );

    res.json({
        message: "Reply sent successfully!"
    });
});
app.listen(PORT, () => {
    console.log(
        "DIJLA DELIVERY is running at http://localhost:" + PORT
    );
}); 