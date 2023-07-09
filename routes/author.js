/**
 * These are example routes for the author section of the blog
 */

const express = require("express");
const router = express.Router();
const assert = require('assert');
// Enables constructing path for article redirects with query string
const url = require('url'); 

// Author Home Page Route: the author can create, review, and edit articles here.
router.get("/", (req, res) => {

    /** 
        * Create a query string for Sqlite3 to create the 'Blog' table if it has not already been created!
    */
    var create_blog_table_query = `CREATE TABLE IF NOT EXISTS blog (id INTEGER PRIMARY KEY,`
        + `title VARCHAR(255) DEFAULT  "My Blog" NOT NULL, `
        + `subtitle VARCHAR(500) DEFAULT "Welcome to my blog!" NOT NULL,`
        + `author VARCHAR(255) DEFAULT "Blog Author" NOT NULL,`
        + `datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP);`;

    //Creates the blog table if has not already been created
    db.run(create_blog_table_query, function (err) {
        if (err) {
            console.log("Error - could not create blog table: " + err);
            // Exit program if could not create the table
            process.exit(1);
        } else {
            // Get blog details from the DB with Select Query
            var get_blog_data_query = `SELECT title, subtitle, author FROM blog;`;
            db.get(get_blog_data_query,
                function (err, blog_data) {
                    if (err) {
                        console.error("Error (no blog data!): " + err);
                        process.exit(1);
                    } else {
                        if (blog_data === undefined){
                            var create_blog_query = `INSERT INTO blog DEFAULT VALUES`; 
                            db.run(create_blog_query, function(err) {
                                if (err){
                                    console.log("Error - could not create blog: " + err);
                                    // Exit program if could not create the blog data
                                    process.exit(1);
                                } else {
                                    // Redirect to the home page again now the blog has been created!
                                    res.redirect("/author/");
                                }
                            })
                        } else {
                            // The blog exists --> display Home Page!
                            console.log("Blog data: " + blog_data.title);
                            // Pass in the blog_data as a variable called 'blog' into the ejs template
                            res.render("author/author-home-page", {
                                blog: blog_data
                            });
                        }
                    }
                });
        }
    });
});


// Author Settings Route: the author can change the blog title/subtitle/author name here
router.get("/settings", (req, res) => {
    // Queries the blog_data table in the DB
    db.get("SELECT title, subtitle, author FROM blog;", 
    function (err, blog_data) { // Callback has 2 args: error and data
        if (err) {
            console.error("Error (no blog data!): " + err);
            process.exit(1);
        } else {
            console.log("Blog data: " + blog_data);
           // Pass in the blog_data as a variable called 'blog' into the ejs template
            res.render("author/author-settings", {
                blog: blog_data
            });
        }
    });
});

// This is where the author writes, amends, and publishes individual articles
router.get("/edit-article", (req, res) => {
    // Load the article with the ID passed in req.query.id from the database
    var query = `SELECT * FROM articles WHERE id = ?`;
    db.get(query, [req.query.id], function (err, data) {
        if (err) {
            console.error("No such article: " + err);
            process.exit(1);
        } else {
            // Only render page if some data is returned from SQL query!
            if (data){
                // Pass data about draft article from DB to the edit-article view
                res.render("author/author-edit-article", {
                    article: data
                });
            // No data returned --> no such article with that ID in the database, so log the error
            } else {
                console.log("Error: no such article");
                process.exit(1);
            }
        }
    });
});

// Creates a new article and stores it in the database after Author clicks "Create New Draft" in Home Page
router.get("/create-new-draft-article", (req, res) => {
    
    /** 
        * Create query string in SQL to create the articles table if it has not already been created
        * "Datetime_published' field defaults to NULL because drafts have not yet been published!
    */
    var query = `CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY,`
    + `datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP, datetime_modified DATETIME DEFAULT CURRENT_TIMESTAMP,`
    + `datetime_published DATETIME, title VARCHAR(500), content TEXT, is_published BOOLEAN DEFAULT 0,` 
    + `likes INTEGER DEFAULT 0);`;

    // Creates the articles table if has not already been created
    db.run(query, function (err) {
        if (err) {
            console.log(err);
            // Exit program if could not create the table
            process.exit(1);
        }
        else {
            var insert_query = `INSERT INTO articles (datetime_published, title, content)`
            + `VALUES (NULL, 'Untitled', '');`; // Set default title of new draft to 'Untitled'
            // Insert new draft article with NULL title and content into the srticles table
            db.run(insert_query,
                function (err) { // No data in callback, only error if appears
                    if (err) {
                        console.error(err);
                    } else {
                        // If draft article successfully created, redirect to edit-article page...
                        res.redirect(
                            url.format({
                                pathname: "/author/edit-article",
                                query: {
                                    "id": this.lastID // Pass the ID of the last-created draft into req.query
                                }
                            }));
                    }
                });
        }
    });

    
});


//////////////////////////////// HELPER FUNCTIONS FOR CALLBACKS /////////////////////////////////////////


module.exports = router;