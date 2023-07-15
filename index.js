const express = require('express');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require("body-parser");
// Imports path library to generate properly-formatted paths
const path = require('path');
// Imports joi input data validation package
const Joi = require('joi');
// Security: Helmet is a collection of middleware functions that set security-related HTTP response headers.
const helmet = require('helmet');
app.use(helmet());
// Add an extra layer of obsecurity to reduce server fingerprinting
app.disable('x-powered-by');

// Import my custom error functionality (Ref: https://sematext.com/blog/node-js-error-handling/#types-of-errors-operational-vs-programmer-errors)
const httpStatusCodes = require('./errors/httpStatusCodes');
const Error404 = require("./errors/Error404");

// Add a rate limiter to protect from brute-force attacks
const rateLimit = require('express-rate-limit');
// Ref: https://medium.com/@samuelnoye35/strengthening-security-in-node-js-best-practices-and-examples-64a408b254cd
const limiter = rateLimit({
  windowMs: 20 * 60 * 1000, // 20 minutes = 1 window
  max: 100, // Maximum 100 requests per window
});
//app.use(limiter);

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
  }
});

const readerRoutes = require('./routes/reader');
const authorRoutes = require('./routes/author');

// Enables access to public assets (stores JS scripts, CSS) folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Sets the app up to use ejs for rendering
app.set("views", __dirname + "/views");
app.set('view engine', 'ejs');

// Test route
app.get('/', (req, res) => {
  res.render("home");
});

// This adds all the readerRoutes to the app under the path /reader
app.use('/reader', readerRoutes);
// This adds all the authorRoutes to the app under the path /author
app.use('/author', authorRoutes);

// 404 - No Resource/URL Found Handler --> call this route if all the other routes have failed!
app.get('*', function(req, res){
  var error = new Error404();
  res.status(404).render("error", {
    error: error,
    message: null
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

