/**
 * These are example routes for the author section of the blog
 */

const express = require("express");
const router = express.Router();
const assert = require('assert');
// Enables constructing path for article redirects with query string
const url = require('url'); 

// Author Home Page Route: the author can create, review, and edit articles here
router.get("/", (req, res) => {

    // Creates a query string to create the 'Blog' table ONLY if it has not already been created!
    var create_blog_table_query = `CREATE TABLE IF NOT EXISTS blog (id INTEGER PRIMARY KEY,`
        + `title VARCHAR(255) DEFAULT  "My Blog" NOT NULL, `
        + `subtitle VARCHAR(500) DEFAULT "Welcome to my blog!" NOT NULL,`
        + `author VARCHAR(255) DEFAULT "Blog Author" NOT NULL,`
        + `datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP);`;

    // Run the blog-table creating query...
    db.run(create_blog_table_query, function (err) {
        if (err) {
            console.log("Error - could not create blog table: " + err);
            // Exit program if could not create the table
            process.exit(1);
        } else {
            // Gets blog info from the database with a Select Query
            var get_blog_data_query = `SELECT title, subtitle, author FROM blog;`;
            db.get(get_blog_data_query,
                function (err, blog_data) {
                    if (err) {
                        // Error with query, log it
                        console.error("Error: " + err);
                        process.exit(1);
                    } else {
                        // No blog exists yet --> create 1 entry (but only if no rows are in the tables)
                        if (blog_data === undefined) {
                            // Creates a new blog entry if no blog row exists in 'blog' table (all defaults!)
                            var create_blog_query = `INSERT INTO blog DEFAULT VALUES`;
                            db.run(create_blog_query, function (err) {
                                if (err) {
                                    console.log("Error - could not create blog!: " + err);
                                    // Exit program if could not create the blog data
                                    process.exit(1);
                                } else {
                                    /** Redirects to this route again once blog is created:
                                     *  blog information should now be fetched from the DB!
                                    */
                                    res.redirect("/author/");
                                }
                            })
                        } else {
                            // The blog exists now!
                            console.log("Blog data: " + blog_data);

                            // Query which checks if the 'articles' table exists now:
                            var check_articles_table_exists_query = `SELECT * FROM sqlite_master`
                                + ` WHERE type='table' AND name='articles';`;

                            db.get(check_articles_table_exists_query, function (err, articles_data) {
                                if (err) {
                                    console.log("Error getting articles data: " + err);
                                    process.exit(1);
                                } else {
                                    console.log("Articles data: " + articles_data);
                                    // Create new articles table if result is undefined
                                    if (articles_data === undefined) {
                                        // "Datetime_published' field is NULL because when draft created it is not yet published!
                                        var create_articles_table_query = `CREATE TABLE IF NOT EXISTS articles `
                                            + `(id INTEGER PRIMARY KEY, datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP,`
                                            + `datetime_modified DATETIME DEFAULT CURRENT_TIMESTAMP,`
                                            + `datetime_published DATETIME, title VARCHAR(500) DEFAULT "Untitled Article" NOT NULL,`
                                            + `content TEXT DEFAULT "" NOT NULL, is_published BOOLEAN DEFAULT 0,`
                                            + `likes INTEGER DEFAULT 0);`;

                                        // Create the articles table
                                        db.run(create_articles_table_query, function (err) {
                                            if (err) {
                                                console.log("Error - cannot create articles table! " + err);
                                                // Exit program if could not create the table
                                                process.exit(1);
                                            } else {
                                                // Redirects to this route again once articles table is created!
                                                res.redirect("/author/");
                                            }
                                        });
                                    } else {
                                        // Both article and blog table exist --> render the view with the data from them
                                        db.all(`SELECT * FROM articles;`, function(err, articles_data){
                                            if (err) {
                                                console.log("Articles error: " + err);
                                                process.exit(1);
                                            } else {
                                                console.log(articles_data.length);
                                                res.render("author/author-home-page", {
                                                    blog: blog_data,
                                                    articles: articles_data
                                                });
                                            }
                                        });
                                    }
                                }
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
    var insert_query = `INSERT INTO articles DEFAULT VALUES;`; // Set default title of new draft to 'Untitled'
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
});


//////////////////////////////// HELPER FUNCTIONS FOR CALLBACKS /////////////////////////////////////////


module.exports = router;