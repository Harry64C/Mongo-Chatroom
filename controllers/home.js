const { run } = require('../db'); // Update the import
const roomGenerator = require('../util/roomIdGenerator.js');

async function loadRooms() {
    try {
        const db = await run();
        const cursor = db.collection('rooms').find({});
        const roomsList = await cursor.toArray();
        return roomsList;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async function getHome(request, response) {
    try {
        const rooms = await loadRooms();
        response.render('home', {
            title: 'Home',
            rooms: rooms,
            isAvailable: rooms.length > 0,
            newRoomId: roomGenerator.roomIdGenerator()
        });
    } catch (error) {
        console.log(error);
        response.status(500).send('Internal Server Error');
    }
}

module.exports = {
    getHome
};