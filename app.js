const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// const session = require('express-session');
//
// // Use express-session middleware
// app.use(session({
//     secret: 'your-secret-key', // A secret key for signing the session ID cookie
//     resave: false,             // Don't force the session to be saved back to the store
//     saveUninitialized: true,   // Save uninitialized sessions
//     cookie: { secure: false },  // For development use. For production, set `secure: true` if using HTTPS
//     clientEmail: ''
// }));

app.use(express.static(path.join(__dirname, 'public')));
// Connect to the SQLite database
const db = new sqlite3.Database('480_project.db', (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Connected to SQLite database.');
      // Enable foreign keys
      db.run('PRAGMA foreign_keys=ON');
    }
  });
  
  const fs = require('fs');

// Check if the database needs initialization
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
  
  // Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });
  
  // Serve other pages as needed
  // Example: Client login
  app.get('/client-login', (req, res) => {
    console.log('Received login data:', req.body);
    const { email, password } = req.body;
    res.sendFile(path.join(__dirname, 'views', 'client-login.html'));
  });
  
  // Add routes for other pages: host login, add car, etc.
app.get('/host-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'host-login.html'));
  });

app.get('/host-register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'host-register.html'));
});

// Host Login Route
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


app.get('/host-homepage', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'host-homepage.html'));
});

// Handle host registration form submission
app.post('/host-register', (req, res) => {
    const { email, name, phone, password, identificationDetails } = req.body;

    // Simple validation to ensure required fields are present
    if (!email || !name || !password) {
        return res.status(400).send('Please fill in all required fields.');
    }

    // Insert the new host into the Owner table using a parameterized query to prevent SQL injection
    const insertOwnerQuery = `
        INSERT INTO Owner (Email, Name, Phone, Password, IdentificationDetails)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(insertOwnerQuery, [email, name, phone, password, identificationDetails], function (err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                // Handle error if the email already exists due to PRIMARY KEY constraint
                return res.status(400).send('An owner with this email already exists. Please use a different email.');
            }
            console.error('Error registering owner:', err);
            return res.status(500).send('An error occurred while registering. Please try again later.');
        }

        // Registration successful
        res.send('Registration successful! You can now <a href="/host-login">login</a>.');
    });
});

app.get('/add-car', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'add_car.html'));
});

// Handle car addition form submission
// Backend Route to Add a Car
app.post('/api/add-car', (req, res) => {
  console.log('Add car request received:', req.body);

  const { vin, make, model, year, licensePlate, dailyPrice, ownerEmail } = req.body;

  // Basic validation
  if (!vin || !make || !model || !year || !licensePlate || !dailyPrice || !ownerEmail) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  const insertCarQuery = `
    INSERT INTO Car (VIN, Make, Model, Year, LicensePlate, DailyPrice, OwnerEmail)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    insertCarQuery,
    [vin, make, model, year, licensePlate, dailyPrice, ownerEmail],
    function (err) {
      if (err) {
        console.error('Error adding car to database:', err.message);
        return res.status(500).json({ success: false, error: 'Database error. Please try again.' });
      }

      console.log('Car added successfully with VIN:', vin);
      res.json({ success: true, message: 'Car added successfully!' });
    }
  );
});


// Client Login Route
app.post('/client-login', (req, res) => {
    const { email, password } = req.body;

    const selectClientQuery = `SELECT * FROM Client WHERE Email = ? AND Password = ?`;

    db.get(selectClientQuery, [email, password], (err, row) => {
      if (err) {
        console.error('Error during client login:', err);
        return res.status(500).send('Error during login.');
      }
      if (row) {
        req.session = { clientEmail: email };
        res.send('Login successful. You can now <a href="/available-cars">view available cars</a>. or <a href="/client-manage-rental">manage your rentals</a>');
      } else {
        res.json({ success: false, error: 'Invalid email or password.' });
      }
    });
  });

app.get('/client-manage-rental', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'client-manage-rental.html'));
});


  app.get('/client-register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'client-register.html'));
});

// Handle client registration form submission
app.post('/client-register', (req, res) => {
    const { email, name, age, phone, password, drivingLicenseNumber, identificationDetails } = req.body;

    // Simple validation to ensure required fields are present
    if (!email || !name || !age || !password || !drivingLicenseNumber) {
        return res.status(400).send('Please fill in all required fields.');
    }

    // Insert the new client into the Client table using a parameterized query to prevent SQL injection
    const insertClientQuery = `
        INSERT INTO Client (Email, Name, Age, Phone, Password, DrivingLicenseNumber, IdentificationDetails)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertClientQuery, [email, name, age, phone, password, drivingLicenseNumber, identificationDetails], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                // This error occurs if the email already exists due to PRIMARY KEY constraint
                return res.status(400).send('A client with this email already exists. Please use a different email.');
            }
            console.error('Error registering client:', err);
            return res.status(500).send('An error occurred while registering. Please try again later.');
        }

        // Registration successful
        res.send('Registration successful! You can now <a href="/client-login">login</a>.');
    });
});


//Gets all the available cars
app.get('/available-cars', (req, res) => {
    // Serve the available-cars.html file
    res.sendFile(path.join(__dirname, 'views', 'available-cars.html'));
});

app.get('/api/available-cars', (req, res) => {
    console.log('Fetching available cars...');
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
            return res.status(500).json({ error: 'Failed to fetch available cars.' });
        }
        res.json({ success: true, cars: rows });
    });
});

app.post('/api/rent-car', (req, res) => {
    const { clientEmail, vin, startDate, endDate } = req.body;

    // console.log('Request body:', req.body); // Debugging line
    // console.log('Client email from session:', req.session.clientEmail);  // Debug log

    // Simple validation
    if (!clientEmail || !vin || !startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    // SQL query to insert into the Rental table
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

// SQL that returns all the cars that belong to the host
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


// Fetch rentals for a specific client
// Example of the backend route to fetch rentals for the client
app.get('/api/fetch-rentals', (req, res) => {
    const { clientEmail } = req.query;

    if (!clientEmail) {
        return res.status(400).json({ success: false, error: 'Client email is required' });
    }

    // Check if client exists
    const checkClientQuery = `SELECT * FROM Client WHERE Email = ?`;
    db.get(checkClientQuery, [clientEmail], (err, client) => {
        if (err || !client) {
            console.error('Client not found:', err || 'No client with this email');
            return res.status(404).json({ success: false, error: 'Client not found' });
        }

        // Now fetch rentals for the client
        const query = `
            SELECT r.VIN, c.Make, c.Model, c.Year, r.StartDate, r.EndDate, c.DailyPrice
            FROM Rental r
            JOIN Car c ON r.VIN = c.VIN
            WHERE r.ClientEmail = ?
        `;
        db.all(query, [clientEmail], (err, rentals) => {
            if (err) {
                console.error('Error fetching rentals:', err);
                return res.status(500).json({ success: false, error: 'Failed to fetch rentals' });
            }

            res.json({
                success: true,
                rentals: rentals || []
            });
        });
    });
});

// Handle car return/cancellation
// Example of the backend route to cancel/return a rental
app.post('/api/cancel-rental', (req, res) => {
    const { vin, clientEmail } = req.body;

    if (!vin || !clientEmail) {
        return res.status(400).json({ success: false, error: 'VIN and client email are required' });
    }

    const cancelQuery = `
        DELETE FROM Rental WHERE VIN = ? AND ClientEmail = ?
    `;

    db.run(cancelQuery, [vin, clientEmail], function (err) {
        if (err) {
            console.error('Error cancelling rental:', err);
            return res.status(500).json({ success: false, error: 'Failed to cancel rental' });
        }

        res.json({ success: true, message: 'Rental cancelled successfully' });
    });
});

app.delete('/api/delete-car', (req, res) => {
    const { vin } = req.body;

    if (!vin) {
        return res.status(400).json({ success: false, error: 'VIN is required to delete a car.' });
    }
    // Check if the car is currently rented
    const checkRentalQuery = `
        SELECT 1 FROM Rental
        WHERE VIN = ? AND date('now') BETWEEN StartDate AND EndDate
        LIMIT 1
    `;

    db.get(checkRentalQuery, [vin], (err, row) => {
        if (err) {
            console.error('Error checking rentals for car:', err.message);
            return res.status(500).json({ success: false, error: 'Failed to check car rentals.' });
        }

        if (row) {
            // If a row is found, the car is currently rented
            return res.status(400).json({ success: false, error: 'This car is currently rented and cannot be deleted.' });
        }

        // If no active rentals, proceed to delete the car
        const deleteCarQuery = `DELETE FROM Car WHERE VIN = ?`;

        db.run(deleteCarQuery, [vin], function (err) {
            if (err) {
                console.error('Error deleting car:', err.message);
                return res.status(500).json({ success: false, error: 'Failed to delete car.' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, error: 'Car not found.' });
            }

            res.json({ success: true, message: 'Car deleted successfully!' });
        });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
