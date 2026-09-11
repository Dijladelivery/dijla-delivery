const fs = require("fs");
const db = require("./database");

const packages = JSON.parse(
    fs.readFileSync("packages-backup.json", "utf8")
);

const insert = db.prepare(
    "INSERT OR REPLACE INTO packages (trackingCode, sender, receiver, origin, destination, status, estimatedDelivery, currentLocation, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

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

console.log("Existing packages imported successfully.");