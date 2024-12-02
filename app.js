const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Connect to the SQLite database
const db = new sqlite3.Database('480_project.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database.');
        db.run('PRAGMA foreign_keys=ON');
    }
});

// Initialize database if needed
const fs = require('fs');
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Client'", (err, row) => {
    if (err) {
        console.error('Error checking for existing tables:', err);
        return;
    }
    if (row) {
        console.log('Database already initialized.');
    } else {
        console.log('Initializing database...');
        const initDb = fs.readFileSync('initialize_db.sql', 'utf8');
        db.exec(initDb, (err) => {
            if (err) {
                console.error('Error initializing database:', err);
            } else {
                console.log('Database initialized successfully.');
            }
        });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/client-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'client-login.html'));
});

app.get('/host-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'host-login.html'));
});

app.get('/host-register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'host-register.html'));
});

app.get('/add-car', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'add_car.html'));
});

app.get('/host-homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'host-homepage.html'));
});

app.get('/available-cars', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'available-cars.html'));
});

app.get('/client-manage-rental', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'client-manage-rental.html'));
});

// **Host Login Route**
app.post('/host-login', (req, res) => {
    const { email, password } = req.body;

    const selectHostQuery = `SELECT * FROM Owner WHERE Email = ? AND Password = ?`;
    db.get(selectHostQuery, [email, password], (err, row) => {
        if (err) {
            console.error('Error during host login:', err);
            return res.status(500).json({ success: false, error: 'Error during login.' });
        }
        if (row) {
            res.json({ success: true, message: 'Login successful.', email, redirectUrl: '/host-homepage' });
        } else {
            res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }
    });
});

// **Client Login Route**
app.post('/client-login', (req, res) => {
    const { email, password } = req.body;

    const selectClientQuery = `SELECT * FROM Client WHERE Email = ? AND Password = ?`;
    db.get(selectClientQuery, [email, password], (err, row) => {
        if (err) {
            console.error('Error during client login:', err);
            return res.status(500).json({ success: false, error: 'Error during login.' });
        }
        if (row) {
            res.json({ success: true, message: 'Login successful.', redirectUrl: '/available-cars' });
        } else {
            res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }
    });
});

// **Host Cars API**
app.get('/api/host-cars', (req, res) => {
    const hostEmail = req.query.email;
    if (!hostEmail) {
        return res.status(400).json({ success: false, error: 'Host email is required.' });
    }

    const selectCarsQuery = `SELECT * FROM Car WHERE OwnerEmail = ?`;
    db.all(selectCarsQuery, [hostEmail], (err, cars) => {
        if (err) {
            console.error('Error fetching cars:', err);
            return res.status(500).json({ success: false, error: 'Error fetching cars.' });
        }
        res.json({ success: true, cars });
    });
});

// **Add Car Route**
app.post('/api/add-car', (req, res) => {
    const { vin, make, model, year, licensePlate, dailyPrice, ownerEmail } = req.body;

    if (!vin || !make || !model || !year || !licensePlate || !dailyPrice || !ownerEmail) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const insertCarQuery = `
        INSERT INTO Car (VIN, Make, Model, Year, LicensePlate, DailyPrice, OwnerEmail)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertCarQuery, [vin, make, model, year, licensePlate, dailyPrice, ownerEmail], function (err) {
        if (err) {
            console.error('Error adding car:', err.message);
            return res.status(500).json({ success: false, error: 'Failed to add car. Please try again.' });
        }
        res.json({ success: true, message: 'Car added successfully!' });
    });
});

// **Available Cars API**
app.get('/api/available-cars', (req, res) => {
    const selectCarsQuery = `
        SELECT * 
        FROM Car 
        WHERE VIN NOT IN (
            SELECT VIN 
            FROM Rental
        )
    `;

    db.all(selectCarsQuery, [], (err, rows) => {
        if (err) {
            console.error('Error fetching available cars:', err);
            res.status(500).json({ error: 'Failed to fetch available cars.' });
        } else {
            res.json(rows);
        }
    });
});

// **Rent Car API**
app.post('/api/rent-car', (req, res) => {
    const { clientEmail, vin, startDate, endDate } = req.body;

    if (!clientEmail || !vin || !startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const insertRentalQuery = `
        INSERT INTO Rental (VIN, ClientEmail, StartDate, EndDate)
        VALUES (?, ?, ?, ?)
    `;

    db.run(insertRentalQuery, [vin, clientEmail, startDate, endDate], function (err) {
        if (err) {
            console.error('Error inserting rental:', err);
            return res.status(500).json({ success: false, error: 'Failed to rent the car.' });
        }
        res.json({ success: true, message: 'Car rented successfully!' });
    });
});

// **Client Rentals API**
app.get('/api/client-rentals', (req, res) => {
    const clientEmail = req.query.email;
    if (!clientEmail) {
        return res.status(400).json({ error: 'Client email is required.' });
    }

    const query = `
        SELECT R.VIN, C.Make, C.Model, C.Year, C.DailyPrice, R.StartDate, R.EndDate
        FROM Rental R
        INNER JOIN Car C ON R.VIN = C.VIN
        WHERE R.ClientEmail = ?
    `;

    db.all(query, [clientEmail], (err, rentals) => {
        if (err) {
            console.error('Error fetching client rentals:', err);
            return res.status(500).json({ error: 'Failed to fetch rentals.' });
        }
        res.json(rentals);
    });
});

// **Return Car API**
app.post('/api/return-car', (req, res) => {
    const { vin, clientEmail } = req.body;

    const deleteRentalQuery = `
        DELETE FROM Rental 
        WHERE VIN = ? AND ClientEmail = ?
    `;

    db.run(deleteRentalQuery, [vin, clientEmail], function (err) {
        if (err) {
            console.error('Error returning car:', err);
            return res.status(500).json({ error: 'Failed to return the car.' });
        }

        res.json({ success: true, message: 'Car returned successfully!' });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
