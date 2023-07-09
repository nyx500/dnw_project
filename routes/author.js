/**
 * These are the routes for the author section of the blog
 */
const express = require("express");
const router = express.Router();
const assert = require('assert');
// Enables constructing path for article redirects with query string
const url = require('url'); 

// Author Home Page Route: the author can create, review, and edit articles here
router.get("/", (req, res) => {

    // SQLite Query: creates the 'blog' table in the DB if and only if the table does not exist yet.
    var create_blog_table_query = `CREATE TABLE IF NOT EXISTS blog (id INTEGER PRIMARY KEY,`
        + `title VARCHAR(255) DEFAULT  "My Blog" NOT NULL, ` // Set default title (can be changed in Settings)
        + `subtitle VARCHAR(500) DEFAULT "Welcome to my blog!" NOT NULL,` // Set default subtitle
        + `author VARCHAR(255) DEFAULT "Blog Author" NOT NULL,` // Set defaut author
        + `datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP);`; // Set default blog-creation time to now in GMT

    // Run the blog-table creating query...
    db.run(create_blog_table_query, function (err) {
        if (err) {
            console.log("Error - could not create blog table: " + err);
            // Exit program if could not create the table
            process.exit(1);
        } else {
            /** If the 'blog' table has been created, retrieve title,subtitle,author values from the
             *  single row in the table which stores details about this blog */
            var get_blog_data_query = `SELECT title, subtitle, author FROM blog;`;
            db.get(get_blog_data_query,
                function (err, blog_data) {
                    if (err) {
                        console.error("Error: " + err);
                        process.exit(1);
                    } else {
                        // No blog exists yet --> create the single blog row required for the blog site to work
                        if (blog_data === undefined) {
                            // Creates a new blog (1 row) in 'blog' table with title/subtitle/author all set to the defaults
                            var create_blog_query = `INSERT INTO blog DEFAULT VALUES`;
                            db.run(create_blog_query, function (err) {
                                if (err) {
                                    console.log("Error - could not create blog!: " + err);
                                    // Exit program if could not create the blog data
                                    process.exit(1);
                                } else {
                                    /** Redirects to this route again once blog is created:
                                     *  first row of 'blog' table storing title/subtitle should now be fetched from the DB!
                                    */
                                    res.redirect("/author/");
                                }
                            })
                        } else {
                            // The blog exists now!
                            console.log("Blog data: " + blog_data);

                            // Query which checks if the 'articles' table exists already:
                            var check_articles_table_exists_query = `SELECT * FROM sqlite_master`
                                + ` WHERE type='table' AND name='articles';`;
                            db.get(check_articles_table_exists_query, function (err, articles_data) {
                                if (err) {
                                    console.log("Error getting articles data: " + err);
                                    process.exit(1);
                                } else {
                                    console.log("Articles data: " + articles_data);
                                    // If undefined, then 'articles' table has not been created --> create it
                                    if (articles_data === undefined) {
                                        // Create the 'articles' table as it does not already exist, set default values
                                        var create_articles_table_query = `CREATE TABLE IF NOT EXISTS articles `
                                            + `(id INTEGER PRIMARY KEY, datetime_created DATETIME DEFAULT CURRENT_TIMESTAMP,`
                                            + `datetime_modified DATETIME DEFAULT CURRENT_TIMESTAMP,`
                                            + `datetime_published DATETIME, title VARCHAR(500) DEFAULT "Untitled Article" NOT NULL,`
                                            + `content TEXT DEFAULT "" NOT NULL, is_published BOOLEAN DEFAULT 0,`
                                            + `likes INTEGER DEFAULT 0);`;

                                        // Creates the articles table
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
                                        /** Run this code only if article and blog table exist:
                                         * Retrieves all the articles from the 'articles' table in DB
                                        */
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
    // Retrieves the blog title/subtitle/author from the 'blog' table (only has one row) in the dtabase
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


// Creates a new article and stores it in the database after Author clicks "Create New Draft" in Home Page
router.get("/create-new-draft-article", (req, res) => {
    // Creates a new article (will be a draft as default of is_published field is 0) in the 'articles' table
    var insert_query = `INSERT INTO articles DEFAULT VALUES;`;
    db.run(insert_query,
        function (err) {
            if (err) {
                console.error(err);
            } else {
                // If draft article is successfully added to 'articles' table, redirect to edit-article page...
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

// This is where the author writes, amends, and publishes individual articles
router.get("/edit-article", (req, res) => {
    // Retrieves the individual article with the correct req.query.id from the database
    var query = `SELECT * FROM articles WHERE id = ?`; // Input: article's id from the inputted GET query string
    db.get(query, [req.query.id], function (err, article_data) {
        if (err) {
            console.error("No such article: " + err);
            process.exit(1);
        } else {
            // Only render page if article was returned from SQL query!
            if (article_data){
                // Pass data about this individual draft article from DB to the edit-article view
                res.render("author/author-edit-article", {
                    article: article_data
                });
            // No data returned --> no such article with that ID in the database, so log the error
            } else {
                console.log("Error: no such article");
                process.exit(1);
            }
        }
    });
});

// Deletes an article from the 'articles' table in the database
router.post("/delete-article", (req, res) => {
    // Deletes article with corresponding ID from the 'articles' table
    var delete_query = `DELETE FROM articles WHERE id = ?`;
    // Article ID sent with the form in POST request using the value in the hidden input HTML element
    db.run(delete_query, [req.body.id], function (err) { 
        if (err) {
            console.log("ERROR - could not delete article! " + err);
        } else {
            res.redirect("/author/");
        }
    });
});

// Publishes a draft article
router.post("/publish-article", (req, res) => {
    // Publishes the draft article with the corresponding ID by updating its is_published field to 1 (True)
    var update_query = `UPDATE articles SET is_published = 1,`
                        + `datetime_published = CURRENT_TIMESTAMP WHERE id = ?`; 
    // Article ID sent with the form in POST request using the value in the hidden input HTML element
    db.run(update_query, [req.body.id], function (err) {
        if (err) {
            console.log("ERROR - could not publish article! " + err);
        } else {
            res.redirect("/author/");
        }
    });
});


//////////////////////////////// HELPER FUNCTIONS FOR CALLBACKS /////////////////////////////////////////


module.exports = router;