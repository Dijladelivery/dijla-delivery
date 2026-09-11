require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./database");
const session = require("express-session");

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
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "DIJLA-DELIVERY-ADMIN-SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60
    }
}));

app.get("/admin-login", (req, res) => {
    res.send(`
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DIJLA DELIVERY - Admin Login</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
            background: #07111f;
            color: white;
        }

        .login-box {
            width: 90%;
            max-width: 420px;
            background: #102235;
            padding: 35px;
            border-radius: 18px;
            box-shadow: 0 15px 45px rgba(0, 0, 0, 0.4);
            text-align: center;
        }

        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #d4af37;
            margin-bottom: 8px;
        }

        .subtitle {
            color: #b8c2cc;
            margin-bottom: 30px;
        }

        h2 {
            margin-bottom: 25px;
            color: white;
        }

        input {
            width: 100%;
            padding: 14px;
            border: 1px solid #38516b;
            border-radius: 8px;
            background: #1b334a;
            color: white;
            font-size: 16px;
            outline: none;
        }

        input:focus {
            border-color: #d4af37;
        }

        button {
            width: 100%;
            margin-top: 15px;
            padding: 14px;
            border: none;
            border-radius: 8px;
            background: #d4af37;
            color: #07111f;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }

        button:hover {
            background: #f0cc55;
        }

        .security {
            margin-top: 20px;
            font-size: 13px;
            color: #9aa8b5;
        }
    </style>
</head>

<body>

    <div class="login-box">

        <div class="logo">DIJLA DELIVERY</div>

        <div class="subtitle">
            Secure Administration Portal
        </div>

        <h2>🔐 Admin Login</h2>

        <form method="POST" action="/admin-login">

            <input
                type="password"
                name="password"
                placeholder="Enter admin password"
                required
            >

            <button type="submit">
                Login to Admin
            </button>

        </form>

        <div class="security">
            🔒 Authorized personnel only
        </div>

    </div>

</body>
</html>

    `);
});
app.post("/admin-login", (req, res) => {
    const password = req.body.password;

    if (password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.redirect("/admin.html");
    }

    res.send("Incorrect admin password. Please go back and try again.");
});
app.get("/admin-logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/admin-login");
    });
});
app.get("/admin.html", (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect("/admin-login");
    }

    res.sendFile(path.join(__dirname, "admin.html"));
});
app.use(express.static(__dirname, {
    index: false
}));

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