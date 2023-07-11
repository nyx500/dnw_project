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
app.use(bodyParser.urlencoded({ extended: true }));

// items in the global namespace are accessible throught out the node application
global.db = new sqlite3.Database('./database.db', function (err) {
  if (err) {
    console.error(err);
    process.exit(1); //Bail out we can't connect to the DB
  } else {
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); //This tells SQLite to pay attention to foreign key constraints

    // Creates the 'blog' table in the DB if and only if the table does not exist yet:
    var create_blog_table_query = `CREATE TABLE IF NOT EXISTS blog (id INTEGER PRIMARY KEY,`
      + `title VARCHAR(255) DEFAULT  "My Blog" NOT NULL, ` // Sets default title to 'My Blog'
      + `subtitle VARCHAR(500) DEFAULT "Welcome to my blog!",` // Sets default subtitle
      + `author VARCHAR(255) DEFAULT "Blog Author" NOT NULL,` // Sets default author
      + `datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP);`; // Sets default blog-creation time to now (GMT)
  }
  
  global.db.run(create_blog_table_query, function (err) {
    if (err) {
      console.error(err);
      process.exit(1); //Bail out if we can't create 'blog' table
    } else {
      console.log("Success: 'blog' table exists in db");

      // Creates the 'articles' table in the DB if and only if the table does not exist yet:
      var create_articles_table_query = `CREATE TABLE IF NOT EXISTS articles `
        // Sets current time in GMT as default for article created time
        + `(id INTEGER PRIMARY KEY, datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP,` 
        + `datetime_modified DATETIME DEFAULT CURRENT_TIMESTAMP,` // Last modified field also set to curr time
        + `datetime_published DATETIME, title VARCHAR(500) DEFAULT "My Article" NOT NULL,`
        + `subtitle VARCHAR(500) DEFAULT "My Subtitle" NOT NULL,`
        + `content TEXT DEFAULT "" NOT NULL, is_published BOOLEAN DEFAULT 0,` // Sets default content as empty str
        + `likes INTEGER DEFAULT 0);`; // Sets default number of likes to 0

      global.db.run(create_articles_table_query, function (err) {
        if (err) {
          console.log(err);
          process.exit(1); // Bail out we can't create 'articles' table
        }
        else {
          console.log("Success: 'articles' table exists in db");

          // Create the 'comments' table if it does not already exist
          var create_comments_table_query = `CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY,`
            + `comment VARCHAR(1000) NOT NULL, article_id INTEGER NOT NULL,`
             // Establishes relationship with article using Foreign Key
            + `FOREIGN KEY (article_id) REFERENCES articles (id)`
            + `);`;
            
          global.db.run(create_comments_table_query, function (err) {
            if (err) {
              console.log(err);
              process.exit(1);
            } else {
              console.log("Success: 'comments' table exists in db");
            }
          });
        }
      });
    }
  });
});

const readerRoutes = require('./routes/reader');
const authorRoutes = require('./routes/author');

// enable access to public assets folder
app.use('/public', express.static(path.join(__dirname, '/public')));

//set the app to use ejs for rendering
app.set("views", __dirname + "/views");
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
