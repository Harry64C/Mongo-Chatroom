// import dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const hbs = require('express-handlebars');
const path = require('path');

require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser')


  async function run() {
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect()
    .then(console.log("connected to database"))
    
    var db = client.db('Mongo-Chatroom');
    return db;
  }

// import handlers
const homeHandler = require('./controllers/home.js');
const roomHandler = require('./controllers/room.js');

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// If you choose not to use handlebars as template engine, you can safely delete the following part and use your own way to render content
// view engine setup
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');



// Create controller handlers to handle requests at each endpoint
app.get('/', homeHandler.getHome);

// create route for the room information
app.get('/rooms', (request, response) => {
    try {
        run().then( (db) => {
            const cursor = db.collection('rooms').find({}); // queries all rooms in the collection
            cursor.toArray().then( (roomData) => {
                // console.log(roomData);
                response.json(roomData);
            });
        })
    } catch(e) {
        console.error(e);
    }
});

async function insertInDB(table, item) {
    run().then( (db) => {
        db.collection(table).insertOne(item);
    })
}

app.post('/create', (request, response) => {
    try {
        insertInDB('rooms', request.body).then( () => {
            console.log('Successfully created a new room.');
            response.redirect('back')
        })
    } catch(error) {
        console.log(error);
        response.sendStatus(500);
    }
});

app.post('/message', (request, response) => {
    try {
        insertInDB('chats', request.body).then( () => {
            console.log('Successfully posted a new message.');
            response.redirect('back');
        })
    } catch(error) {
        console.log(error);
        response.sendStatus(500);
    }
});


app.get('/room/:roomID', roomHandler.getRoom);




const router = express.Router();

//Export the router
module.exports = router;

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));