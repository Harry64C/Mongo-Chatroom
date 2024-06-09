const express = require('express');
const cookieParser = require('cookie-parser');
const hbs = require('express-handlebars');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

require("dotenv").config();
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');

async function run() {
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect()
        .then(console.log("connected to database"))
        .catch(err => console.error("Failed to connect to database", err));
    
    var db = client.db('Mongo-Chatroom');
    return db;
}

const homeHandler = require('./controllers/home.js');
const roomHandler = require('./controllers/room.js');

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/' }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login');
});

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


async function getUserFromDatabase(username) {
    const db = await run();
    return await db.collection('users').findOne({ username });
}

async function insertUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await run();
    await db.collection('users').insertOne({ username, password: hashedPassword });
}

app.get('/register', (req, res) => {
    res.render('register');
});

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

app.get('/', isAuthenticated, homeHandler.getHome);

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

async function insertInDB(table, item) {
    try {
        const db = await run();
        await db.collection(table).insertOne(item);
        console.log(`Successfully inserted item into ${table}:`, item);
    } catch (error) {
        console.error(`Failed to insert item into ${table}:`, error);
    }
}

app.post('/create', isAuthenticated, async (request, response) => {
    try {
        console.log('Form Data:', request.body);
        await insertInDB('rooms', request.body);
        console.log('Successfully created a new room.');
        response.redirect('back');
    } catch (error) {
        console.log(error);
        response.sendStatus(500);
    }
});

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

app.get('/room/:roomID', isAuthenticated, roomHandler.getRoom);

const router = express.Router();

module.exports = router;

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
