const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

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

  app.get('/add-car', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'add_car.html'));
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
        res.send('Login successful. You can now <a href="/available-cars">view available cars</a>.');
      } else {
        res.send('Invalid email or password.');
      }
    });
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
    const selectCarsQuery = `SELECT * FROM Car`;
  
    db.all(selectCarsQuery, [], (err, cars) => {
      if (err) {
        console.error('Error fetching cars:', err);
        return res.status(500).json({ error: 'Error fetching cars.' });
      }
      res.json(cars);
    });
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});