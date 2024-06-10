const express = require('express');
const cookieParser = require('cookie-parser');
const hbs = require('express-handlebars');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { run } = require('./db'); // Update the import
const { ObjectId } = require('mongodb');
const homeHandler = require('./controllers/home.js');
const roomHandler = require('./controllers/room.js');

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: path.join(__dirname, 'views', 'layouts') }));
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

app.get('/rooms', isAuthenticated, async (request, response) => {
    try {
        const db = await run();
        const cursor = db.collection('rooms').find({});
        const roomData = await cursor.toArray();
        response.json(roomData);
    } catch (e) {
        console.error(e);
        response.status(500).send('Internal Server Error');
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

app.post('/create', isAuthenticated, async (request, response) => {
    try {
        await insertInDB('rooms', request.body);
        console.log('Successfully created a new room.');
        response.redirect('/');
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

app.get('/room/:roomID', isAuthenticated, roomHandler.getRoom);

const router = express.Router();

module.exports = { router }; // No need to export `run` from here anymore

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
