const express = require('express');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require("body-parser");
// Imports path library to generate properly-formatted paths
const path = require('path');
// Security: Helmet is a collection of middleware functions that set security-related HTTP response headers.
const helmet = require('helmet');
app.use(helmet());
// Add an extra layer of obsecurity to reduce server fingerprinting
app.disable('x-powered-by');

// Import my custom error functionality 
// Ref: https://sematext.com/blog/node-js-error-handling/#types-of-errors-operational-vs-programmer-errors
const httpStatusCodes = require('./errors/httpStatusCodes');
const Error404 = require("./errors/Error404");
// A helper function which renders the error page if data cannot be retrieved/updated OR 404 error occurs
const returnErrorPage = require("./errors/errorFunction");

// Add a rate limiter here to protect from too many requests from one IP address
const rateLimit = require('express-rate-limit');
// Ref: https://medium.com/@samuelnoye35/strengthening-security-in-node-js-best-practices-and-examples-64a408b254cd
const limiter = rateLimit({
  windowMs: 20 * 60 * 1000, // 20 minutes = 1 time window
  max: 100, // Set a maximum of 100 requests per time window
});
app.use(limiter); // Run limiter

// Handles post requests --> must define it before defining the routes or doesn't work!!!
app.use(bodyParser.urlencoded({ extended: true }));

// Items in the global namespace are accessible throught out the node application
global.db = new sqlite3.Database('./database.db', function (err) {
  if (err) {
    console.error(err);
    process.exit(1); //Bail out we can't connect to the DB
  } else {
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); //This tells SQLite to pay attention to foreign key constraints
  }
});

// Add all routes to reader and author pages
const authorRoutes = require('./routes/author');
const readerRoutes = require('./routes/reader');

// Enables access to public assets (stores JS scripts, fonts and CSS) folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Sets the app up to use ejs for rendering
app.set("views", __dirname + "/views");
app.set('view engine', 'ejs');  


// This adds all the readerRoutes to the app under the path /reader
app.use('/reader', readerRoutes);
// This adds all the authorRoutes to the app under the path /author
app.use('/author', authorRoutes);

// Route to general Welcome page
app.get('/', (req, res) => {
  res.render("home");
});

// 404 - No Resource/URL Found Handler --> calls this route if all the other routes have failed!
app.get('*', function(req, res){
  var error = new Error404();
  returnErrorPage(res, error);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

