// Controller handler to handle functionality in home page


async function loadRooms() { // fetches list of rooms from the server with GET
  let roomsList = []

  try {
    let response = await fetch("http://localhost:8080/rooms");
    let data = await response.text();
    roomsList = JSON.parse(data);
    //console.log(roomsList)
  } catch(error) {
    console.log(error)
  }
  return roomsList;
}


function getHome(request, response){
  
  loadRooms().then(items => {
    response.render('home', {title: 'home', rooms: items, isAvailable: true});
  });
}

module.exports = {
    getHome
};
