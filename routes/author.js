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
    // Queries the blog_data table in the DB
    db.get("SELECT blog_title title, blog_subtitle subtitle, blog_author author FROM blog_data;", 
    function (err, blog_data) { // Callback has 2 args: error and data
        if (err) {
            console.log(`ERROR - could not get blog details: ${err}`);
            process.exit(1);
        } else {
            console.log(blog_data);
            // Passes in the blog_data row from the DB as a variable called 'blog' into the ejs template
            res.render("author-home-page", {
                blog: blog_data
            });
        }
    });
});


// Author Settings Route: the author can change the blog title/subtitle/author name here
router.get("/settings", (req, res) => {
    // Queries the blog_data table in the DB
    db.get("SELECT blog_title title, blog_subtitle subtitle, blog_author author FROM blog_data;", 
    function (err, blog_data) { // Callback has 2 args: error and data
        if (err) {
            console.log(`ERROR - could not get blog details: ${err}`);
            process.exit(1);
        } else {
            console.log(blog_data);
            // Passes in the blog_data row from the DB as a variable called 'blog' into the ejs template
            res.render("author-settings", {
                blog: blog_data
            });
        }
    });
});

// This is where the author writes, amends, and publishes individual articles
router.get("/edit-article", (req, res) => {
    // Load the article with the ID passed in req.query.id from the database
    var query = `SELECT * FROM draftArticles WHERE id = ?`;
    db.get(query, [req.query.id], function (err, data) {
        if (err) {
            console.error("No such article: " + err);
            process.exit(1);
        } else {
            // Only render page if some data is returned from SQL query!
            if (data){
                // Pass data about draft article from DB to the edit-article view
                res.render("author-edit-article", {
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
        * Create query string in SQL to create the draftArticles table if it has not already been created
        * "Datetime_published' field defaults to NULL because drafts have not yet been published!
    */
    var query = `CREATE TABLE IF NOT EXISTS draftArticles (id INTEGER PRIMARY KEY,`
    + `datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP, datetime_modified DATETIME DEFAULT CURRENT_TIMESTAMP,`
    + `datetime_published DATETIME, title VARCHAR(500), content TEXT);`;

    // Creates the draftArticles table if has not already been created
    db.run(query, function (err) {
        if (err) {
            console.log(err);
            // Exit program if could not create the table
            process.exit(1);
        }
        else {
            // Insert new draft article with NULL title and content into the draftArticles table
            db.run("INSERT INTO draftArticles (datetime_published, content) VALUES (NULL, NULL);",
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