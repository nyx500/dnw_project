const express = require('express');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require("body-parser");
// Imports path library to generate properly-formatted paths
const path = require('path');
// Imports joi input data validation package
const Joi = require('joi');


// handles post requests --> must define it before defining the routes or doesn't work!!!
app.use(bodyParser.urlencoded({extended: true}));

//items in the global namespace are accessible throught out the node application
global.db = new sqlite3.Database('./database.db',function(err){
  if(err){
    console.error(err);
    process.exit(1); //Bail out we can't connect to the DB
  }else{
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); //This tells SQLite to pay attention to foreign key constraints
  }
});

const readerRoutes = require('./routes/reader');
const authorRoutes = require('./routes/author');

// enable access to public assets folder
app.use('/public', express.static(path.join(__dirname, '/public')));

//set the app to use ejs for rendering
app.set("views",__dirname + "/views");  
app.set('view engine', 'ejs');

// test page
app.get('/', (req, res) => {
  res.send('Hello World!')
});

//this adds all the readerRoutes to the app under the path /reader
app.use('/reader', readerRoutes);
//this adds all the authorRoutes to the app under the path /author
app.use('/author', authorRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


// SQL Queries
//To retrieve data from the Database
// db.get("SELECT * FROM testUsers", function(err, data) { // Callback has 2 args: error and data
//   if (err) {
//     console.log("No such data!");
//     console.error(err);
//     process.exist(1);
//   } else {
//     console.log(data);
//   }
// });

// .get only retrieves the first row from the database/table which it finds
// we need to use a different command to retrieve all the records: db.all!
// db.all("SELECT * FROM testUsers;", function(err, data) { // Callback has 2 args: error and data
//   if (err) {
//     console.log("No such data!");
//     console.error(err);
//     process.exist(1);
//   } else {
//     console.log(data);
//   }
// });



// Putting Data in the Database
// db.run("INSERT INTO testUsers (user_name, user_email) VALUES ('Amy Silver', 'a_silver@hotmail.com')",
//  function(err) { // No data in callback, only error
//   if (err) {
//     console.log("Error!");
//     console.error(err);
//   }
// });

// Adding a dynamic value to the query: best practice
// ? need to be ordered in the same order as they appear in the command
// If %Gmail% is the first command, it will replace the first question mark
// db.all("SELECT * FROM testUsers WHERE user_email LIKE ?", ["%Gmail%"],
//  function(err, data) { // Callback has 2 args: error and data
//   if (err) {
//     console.log("No such data!");
//     console.error(err);
//     process.exist(1);
//   } else {
//     console.log(data);
//   }
// });
