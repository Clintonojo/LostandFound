require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
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
    host: process.env.DB_HOST, // Use environment variables
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
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
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// Endpoint to fetch all items with security questions
app.get('/items', (req, res) => {
    const sql = `
        SELECT 
            items.id, 
            items.name, 
            items.description, 
            items.latitude, 
            items.longitude, 
            items.phone_number,
            security_questions.question, 
            security_questions.answer
        FROM items
        LEFT JOIN security_questions ON items.id = security_questions.item_id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching items:', err);
            return res.status(500).send('Error fetching items');
        }

        // Group items by their ID and include security questions
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
            if (row.question && row.answer) {
                itemsMap[row.id].securityQuestions.push({
                    question: row.question,
                    answer: row.answer
                });
            }
        });

        // Convert the items map to an array
        const items = Object.values(itemsMap);
        res.json(items);
    });
});

// Endpoint to delete an item by ID
app.delete('/delete-item/:id', (req, res) => {
    const itemId = req.params.id;

    const deleteItemSql = 'DELETE FROM items WHERE id = ?';
    const deleteQuestionsSql = 'DELETE FROM security_questions WHERE item_id = ?';

    // First, delete the security questions associated with the item
    db.query(deleteQuestionsSql, [itemId], (err) => {
        if (err) {
            console.error('Error deleting security questions:', err);
            return res.status(500).send('Error deleting security questions');
        }

        // Then, delete the item itself
        console.log('Deleting item with ID:', itemId);
        db.query(deleteItemSql, [itemId], (err) => {
            if (err) {
                console.error('Error deleting item:', err);
                return res.status(500).send('Error deleting item');
            }

            res.send('Item deleted successfully');
        });
    });
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Export the app and a function to close the database connection
module.exports = {
    app,
    closeDatabase: () => db.end()
};
