// Controller handler to handle functionality in home page

async function loadRooms() {

  let roomsList = []
  try {
    let response = await fetch("http://localhost:8080/rooms");
    let data = await response.text();

    console.log(JSON.parse(data));
    roomsList = JSON.parse(data);
  } catch(error) {
    console.log(error)
  }


//   if (response.status === 200) {
//       let data = await response.text();
//       console.log(data);
//       const books = JSON.parse(data);

//       for (let book of books) {
//           const x = `
// <div class = "col-4">
//   <div class = "card">
//       <div class = "card-body">
//           <h5 class = "card-title">${book.title}</h5>
//           <h6 class = "card-subtitle mb-2 text-muted">${book.isbn}</h6>

//           <div>Author: ${book.author}</div>
//           <div>Publisher: ${book.publisher}</div>
//           <div>Number of Pages: ${book.numOfPages}</div>

//           <hr>

//           <button type = "button" onClick = "deleteBook(${book.isbn})" class = "btn btn-danger">Delete</button>

//           <button types = "button" class = "btn btn-primary" data-toggle = "modal"
//               data-target = "#editBookModal" onClick = "setEditModal(${book.isbn})">
//               Edit
//           </button>
//       </div>
//   </div>
// </div>      
//           `

//           document.getElementById('rooms').innerHTML += x;
//       }
//   }
}


function getHome(request, response){
  
  loadRooms();
  response.render('home', {title: 'home'});
}

module.exports = {
    getHome
};
