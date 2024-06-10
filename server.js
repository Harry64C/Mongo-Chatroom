// Import dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const hbs = require('express-handlebars');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
require("dotenv").config();
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');

// Import handlers
const homeHandler = require('./controllers/home.js');
const roomHandler = require('./controllers/room.js');

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/' }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Add session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Database functions
async function run() {
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect()
        .then(console.log("connected to database"))
        .catch(err => console.error("Failed to connect to database", err));
    
    var db = client.db('Mongo-Chatroom');
    return db;
}

async function insertInDB(table, item) {
    try {
        const db = await run();
        await db.collection(table).insertOne(item);
        console.log(`Successfully inserted item into ${table}:`, item);
    } catch (error) {
        console.error(`Failed to insert item into ${table}:`, error);
    }
}

async function removeFromDB(table, id) {
    try {
        const db = await run();
        await db.collection(table).deleteOne({ _id: ObjectId.createFromHexString(id) });
    } catch (e) {
        console.error(e);
    }
}

async function editInDB(id, newContent) {
    try {
        const db = await run();
        await db.collection('chats').updateOne(
            { _id: ObjectId.createFromHexString(id) },
            { $set: { message: newContent } }
        );
    } catch (e) {
        console.error(e);
    }
}

async function getUserFromDatabase(username) {
    const db = await run();
    return await db.collection('users').findOne({ username });
}

async function insertUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await run();
    await db.collection('users').insertOne({ username, password: hashedPassword });
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Serve the login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle login submissions
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await getUserFromDatabase(username);

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.redirect('/');
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});

// Serve the registration page
app.get('/register', (req, res) => {
    res.render('register');
});

// Handle registration submissions
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const user = await getUserFromDatabase(username);

    if (user) {
        res.redirect('/register');
    } else {
        await insertUser(username, password);
        res.redirect('/login');
    }
});

// Create controller handlers to handle requests at each endpoint
app.get('/', isAuthenticated, homeHandler.getHome);

// create route for the room information
app.get('/rooms', isAuthenticated, (request, response) => {
    try {
        run().then((db) => {
            const cursor = db.collection('rooms').find({});
            cursor.toArray().then((roomData) => {
                response.json(roomData);
            });
        })
    } catch (e) {
        console.error(e);
    }
});

// Create room
app.post('/create', isAuthenticated, async (request, response) => {
    try {
        await insertInDB('rooms', request.body);
        console.log('Successfully created a new room.');
        response.redirect('back');
    } catch (error) {
        console.log(error);
        response.sendStatus(500);
    }
});

// Post chat message
app.post('/message', isAuthenticated, async (request, response) => {
    try {
        await insertInDB('chats', request.body);
        console.log('Successfully posted a new message.');
        response.redirect('back');
    } catch (error) {
        console.log(error);
        response.sendStatus(500);
    }
});

// Delete message
app.delete('/message/:id', isAuthenticated, async (request, response) => {
    const messageID = request.params.id;
    try {
        await removeFromDB('chats', messageID);
        response.send('Message is deleted');
    } catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});

// Edit message
app.post('/edit', isAuthenticated, async (request, response) => {
    const item = request.body;
    try {
        await editInDB(item.msgID, item.message);
        console.log('Message is edited');
        response.redirect('back');
    } catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});

// Room handler
app.get('/room/:roomID', isAuthenticated, roomHandler.getRoom);

const router = express.Router();

// Export the router
module.exports = router;

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
