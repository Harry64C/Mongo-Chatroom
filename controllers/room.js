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

async function loadChat(id, param) { // fetches chat messages from the server with GET
    
    if (!param) { // if no valid search parameter match everything
        param = /.+/
    }
    
    try {
        const db = await run();
        const cursor = db.collection('chats').find({
            roomID : id,
            message: { $regex: param }
        });
        let data = await cursor.toArray();
        console.log(data);
        return data;
    } catch(e) {
            console.error(e);
    }
}

async function getRoomName(id) { // fetches chat messages from the server with GET
    try {
        const db = await run();
        const cursor = db.collection('rooms').find({id : id})
        let data = await cursor.toArray();
        let name = data[0].roomName;
        return name;
    } catch(e) {
            console.error(e);
    }
}


// Example for handle a get request at '/:roomName' endpoint.
async function getRoom(request, response){
    id = request.params.roomID;
    const name = await getRoomName(id);
    time = moment().get('hour') + ":" + moment().get('minute');

    let queryString = '';
    queryString = request.query.search;
    
    const chatData = await loadChat(id, queryString);

    response.render('room', {
        title: 'chatroom', roomName: name, id: id, time: time, chats: chatData, isAvailable: true
    });
}


module.exports = {
    getRoom
};