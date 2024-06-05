// Controller handler to handle functionality in room page


var moment = require('moment'); // require moment for date / time
moment("123", "hmm").format("HH:mm") === "01:23"

require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');

async function run() {
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect()    
    var db = client.db('Mongo-Chatroom');
    return db;
  }

async function loadChat(id) { // fetches chat messages from the server with GET
    try {
        const db = await run();
        const cursor = db.collection('chats').find({roomID : id})
        const data = await cursor.toArray();
        console.log(data);
        return data;
    } catch(e) {
            console.error(e);
    }
}

async function getRoom(id) { // fetches chat messages from the server with GET
    try {
        const db = await run();
        const cursor = db.collection('rooms').find({id : id})
        const data = await cursor.toArray();
        data = data[0]
        console.log(data);
        return data;
    } catch(e) {
            console.error(e);
    }
}

// Example for handle a get request at '/:roomName' endpoint.
async function getRoom(request, response){
    id = request.params.roomID;
    time = moment().get('hour') + ":" + moment().get('minute');

    const chatData = await loadChat(id);
    //const roomName = await getRoomName(id);

    response.render('room', {
        title: 'chatroom', roomName: id, time: time, chats: chatData, isAvailable: true
    });
}


module.exports = {
    getRoom
};