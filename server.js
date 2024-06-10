const express = require('express');
const cookieParser = require('cookie-parser');
const hbs = require('express-handlebars');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
require("dotenv").config();

const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
const { body, validationResult, check } = require('express-validator');


// import handlers

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


// -------- Database functions --------
async function run() {
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect()
    .then(console.log("connected to database"))
    
    var db = client.db('Mongo-Chatroom');
    return db;
}

async function insertInDB(table, item) {
    try {
        let db = await run();
        db.collection(table).insertOne(item);
    }
    catch(e) {
        console.error(e);
    }
}

async function removeFromDB(table, id) {
    try {
        const db = await run();
        db.collection(table).deleteOne( { _id: ObjectId.createFromHexString(id) });
    }
    catch(e) {
        console.error(e);
    }
}

async function editInDB(id, newContent) {
    try {
        const db = await run();
        db.collection('chats').updateOne(
            { _id: ObjectId.createFromHexString(id) }, 
            { $set: { message: newContent } }
        );
    }
    catch(e) {
        console.error(e);
    }
}




// Create controller handlers to handle requests at each endpoint
app.get('/', homeHandler.getHome);


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

app.post('/login', 
    [
        check('username').isLength({ min: 1 }).trim().escape(),
        check('password').isLength({ min: 1 }).trim().escape()
    ],
    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        try{
            const user = await getUserFromDatabase(username);

            if (user && await bcrypt.compare(password, user.password)) {

                req.session.user = user;
                res.redirect('/');

            } else {

                res.render('login', { error: 'Invalid username or password' });

            }
        }catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
});

/*app.post('/message',
    [
        check('message').isLength({ min: 1 }).trim().escape(),
    ], 
    async (request, response) => { 

        const errors = validationResult(request);

        if (!errors.isEmpty()) {
            return response.status(400).json({errors: errors.array()});
        }

        try {

            await insertInDB('chats', request.body);
            console.log('Message has been posted');
            response.redirect('back');

        } catch (error) {

            console.log(error);
            response.sendStatus(500);

        }
  });
*/

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', 
    [
        check('username').isLength({ min: 1 }).trim().escape(),
        check('password').isLength({ min: 1 }).trim().escape()
    ],
    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try{
            const user = await getUserFromDatabase(username);

            if (user) {
                res.redirect('/register');
            } else {
                await insertUser(username, password);
                res.redirect('/login');
            }
        }catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    }
);

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




app.post('/create', (request, response) => { // create room
    try {
        insertInDB('rooms', request.body).then( () => {
            console.log('Successfully created a new room.');
            response.redirect('back')
        })
    } catch(e) {
        console.error(e);
        response.sendStatus(500);
    }
});

app.delete('/message/:id', (request, response) => { // delete message 
    let messageID = request.params.id;
    try {
        removeFromDB('chats', messageID).then( () => {
            response.send('Message is deleted');
        })
    } catch(e) {
        console.error(e);
        response.sendStatus(500);
    }
});

app.post('/edit', (request, response) => { // edit message 
    let item = request.body;
    try {
        editInDB(item.msgID, item.message).then( () => {
            console.log('Message is edited');
            response.redirect('back');
        })
    } catch(e) {
        console.error(e);
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


module.exports = router;

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
