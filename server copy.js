const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 3000;

const packagesFile = path.join(__dirname, "packages.json");
if (!fs.existsSync(packagesFile)) {
    fs.writeFileSync(packagesFile, JSON.stringify({
        DIJLA1001: {
            trackingCode: "DIJLA1001",
            sender: "DIJLA STORE",
            receiver: "John Doe",
            origin: "Lagos, Nigeria",
            destination: "Abuja, Nigeria",
            currentLocation: "Lagos, Nigeria",
            status: "In Transit"
        }
    }, null, 2));
}

function getPackages() {
    return JSON.parse(fs.readFileSync(packagesFile, "utf8"));
}

function savePackages(packages) {
    fs.writeFileSync(
        packagesFile,
        JSON.stringify(packages, null, 2)
    );
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
        estimatedDelivery: req.body.estimatedDelivery,
latitude: req.body.latitude,
longitude: req.body.longitude
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
app.listen(PORT, () => {
    console.log("DIJLA DELIVERY is running at http://localhost:" + PORT);
});