const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors({origin:'*'}));
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '9021315376',   // your mysql password
    database: 'legal_smiths'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// ✅ Register route
app.post('/register', (req, res) => {
    const { Name, Email, password, phoneno } = req.body;

    if (!Name || !Email || !password || !phoneno) {
        return res.status(400).send('All fields are required');
    }

    const sql = "INSERT INTO users (name, email, password, phoneno) VALUES (?, ?, ?, ?)";
    db.query(sql, [Name, Email, password, phoneno], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        res.send('Registration successful!');
    });
});

// Login route
app.post('/login', (req, res) => {
    const { Email, password } = req.body;

    if (!Email || !password) {
        return res.status(400).send('Email and password are required');
    }

    const sql = "SELECT * FROM registration WHERE email = ? AND password = ?";
    db.query(sql, [Email, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            res.send('Login successful!');
        } else {
            res.status(401).send('Invalid email or password');
        }
    });
});