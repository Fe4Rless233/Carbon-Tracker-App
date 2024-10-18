const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS setup
app.use(cors({
    origin: 'http://localhost:5500', // Update to match your frontend's origin
    credentials: true
}));

// Session configuration
app.use(session({
    secret: 'your_secret_key', // Replace with a secure random secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Database setup - point to the carbon_tracker.db in the root directory
const db = new sqlite3.Database(path.join(__dirname, '..', 'carbon_tracker.db'), (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        goals TEXT,  -- Store goals as a JSON string
        achievements TEXT,  -- Store achievements as a JSON string
        preferences TEXT,  -- Store user preferences as a JSON string
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User Signup
app.post('/signup', (req, res) => {
    const { first_name, last_name, username, password } = req.body;
    const sql = `INSERT INTO users (first_name, last_name, username, password) VALUES (?, ?, ?, ?)`;

    db.run(sql, [first_name, last_name, username, password], function (err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        // Create a new session for the user
        const sessionSql = `INSERT INTO user_sessions (user_id, goals, achievements, preferences) VALUES (?, ?, ?, ?)`;
        db.run(sessionSql, [this.lastID, JSON.stringify([]), JSON.stringify([]), JSON.stringify({})], function(err) {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.status(201).send({ id: this.lastID });
        });
    });
});

// User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;

    db.get(sql, [username, password], (err, row) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (row) {
            req.session.userId = row.id;
            req.session.username = row.username;

            // Fetch session data from the user_sessions table
            const sessionSql = `SELECT * FROM user_sessions WHERE user_id = ?`;
            db.get(sessionSql, [row.id], (err, sessionRow) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                if (sessionRow) {
                    // Load goals, achievements, and preferences from sessionRow
                    req.session.goals = JSON.parse(sessionRow.goals || '[]');
                    req.session.achievements = JSON.parse(sessionRow.achievements || '[]');
                    req.session.preferences = JSON.parse(sessionRow.preferences || '{}');
                } else {
                    // Initialize empty session data if not found
                    req.session.goals = [];
                    req.session.achievements = [];
                    req.session.preferences = {};
                }
                res.status(200).send(`Welcome back, ${row.first_name}!`);
            });
        } else {
            res.status(401).send('Invalid username or password.');
        }
    });
});

// Add Goal
app.post('/add-goal', (req, res) => {
    const { goal } = req.body;
    const userId = req.session.userId; // Get the logged-in user's ID

    // Save the goal to the user_sessions table
    const updateSessionSql = `UPDATE user_sessions SET goals = ? WHERE user_id = ?`;
    db.get(`SELECT goals FROM user_sessions WHERE user_id = ?`, [userId], (err, row) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        const currentGoals = JSON.parse(row.goals || '[]');
        currentGoals.push(goal); // Add the new goal to the existing goals

        db.run(updateSessionSql, [JSON.stringify(currentGoals), userId], function(err) {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.status(200).send('Goal added successfully');
        });
    });
});

// Session Data Endpoint
app.get('/session-data', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Unauthorized');
    }

    const sessionSql = `SELECT goals, achievements FROM user_sessions WHERE user_id = ?`;
    db.get(sessionSql, [userId], (err, sessionRow) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (sessionRow) {
            res.json({
                goals: JSON.parse(sessionRow.goals || '[]'),
                achievements: JSON.parse(sessionRow.achievements || '[]'),
            });
        } else {
            res.json({ goals: [], achievements: [] });
        }
    });
});

// Logout
app.post('/signOut', (req, res) => {
    const userId = req.session.userId;

    // Optionally update the user_sessions table
    const updateSessionSql = `UPDATE user_sessions SET goals = ?, achievements = ?, preferences = ? WHERE user_id = ?`;
    db.run(updateSessionSql, [JSON.stringify(req.session.goals), JSON.stringify(req.session.achievements), JSON.stringify(req.session.preferences), userId], function(err) {
        if (err) {
            console.error('Error updating session data:', err);
        }
    });

    req.session.destroy(err => { 
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Logout failed');
        }
        res.send('Logged out successfully'); 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Close the database connection on exit
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database ' + err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
