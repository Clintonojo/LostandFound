const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // Serve static files from the 'public' directory

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Home1234?', // Replace with your actual database password
    database: 'lost_and_found'
});

db.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Database connected!');
});

// Root route to serve 'index.html'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Corrected path to index.html
});

// User Registration Endpoint
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Missing username or password');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(sql, [username, hashedPassword], (err) => {
        if (err) {
            console.error('Registration Error:', err);
            return res.status(500).send('Error registering user');
        }
        res.send('User registered successfully');
    });
});

// User Login Endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Missing username or password');
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Login Error:', err);
            return res.status(500).send('Error logging in');
        }

        if (results.length === 0) {
            return res.status(401).send('Error: User not found');
        }

        const user = results[0];

        if (bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user.id, username: user.username }, 'yourSecretKey', { expiresIn: '1h' });
            res.send(`Login successful! Token: ${token}`);
        } else {
            res.status(401).send('Error: Incorrect username or password');
        }
    });
});

// Item Submission Endpoint
app.post('/submit-item', (req, res) => {
    const { itemName, description, lat, lng, phoneNumber, securityQuestions } = req.body;

    if (!itemName || !description || !lat || !lng || !phoneNumber || !securityQuestions) {
        return res.status(400).send('Missing required fields');
    }

    const sql = 'INSERT INTO items (name, description, latitude, longitude, phone_number) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [itemName, description, lat, lng, phoneNumber], (err, results) => {
        if (err) {
            console.error('Item Submission Error:', err);
            return res.status(500).send('Error submitting item');
        }

        const itemId = results.insertId;
        const questionSql = 'INSERT INTO security_questions (item_id, question, answer) VALUES (?, ?, ?)';
        securityQuestions.forEach(({ question, answer }) => {
            db.query(questionSql, [itemId, question, answer], (err) => {
                if (err) {
                    console.error('Security Question Error:', err);
                }
            });
        });

        res.send('Item and security questions submitted successfully');
    });
});

 // Endpoint to get all submitted items and their security questions
app.get('/items', (req, res) => {
    const sql = `
        SELECT items.id, items.name, items.description, items.latitude, items.longitude, items.phone_number,
               security_questions.question, security_questions.answer
        FROM items
        LEFT JOIN security_questions ON items.id = security_questions.item_id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching items:', err);
            return res.status(500).send('Error fetching items');
        }

        // Organize items with their security questions
        const itemsMap = {};
        results.forEach(row => {
            if (!itemsMap[row.id]) {
                itemsMap[row.id] = {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    phone_number: row.phone_number,
                    securityQuestions: []
                };
            }
            // Push security questions only if they exist
            if (row.question && row.answer) {
                itemsMap[row.id].securityQuestions.push({
                    question: row.question,
                    answer: row.answer
                });
            }
        });

        // Convert items map to an array
        const items = Object.values(itemsMap);
        res.json(items);
    });
});
app.post('/logout', (req, res) => {
    // Destroy the session (if using Express sessions)
    req.session.destroy(err => {
        if (err) {
            console.error('Failed to destroy session:', err);
            res.status(500).send('Error logging out');
        } else {
            res.clearCookie('connect.sid'); // Clear session cookie
            res.status(200).send('Logged out successfully');
        }
    });
});


// Mock user data
const userInfo = {
    username: "John Doe",
    email: "john.doe@example.com"
};

const userClaims = [
    { name: "Wallet", description: "Black wallet", status: "Pending" },
    { name: "Keys", description: "Car keys", status: "Claimed" }
];

const userSubmittedItems = [
    { name: "Bag", description: "Blue backpack", status: "Awaiting Claim" },
    { name: "Glasses", description: "Prescription glasses", status: "Claimed" }
];

// Endpoint to get user info
app.get('/user-info', (req, res) => {
    res.json(userInfo);
});

// Endpoint to get user claims
app.get('/user-claims', (req, res) => {
    res.json(userClaims);
});

// Endpoint to get user submitted items
app.get('/user-submitted-items', (req, res) => {
    res.json(userSubmittedItems);
});



app.get('/security-questions', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'security_questions.html'));
});


// Start server
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
