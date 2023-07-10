/**
 * These are the routes for the author section of the blog
 */
const express = require("express");
const router = express.Router();
const assert = require('assert');
// Enables constructing path for article redirects with query string
const url = require('url'); 
// Imports joi input data validation package
const Joi = require('joi');
// Import modules from express-validation for form data validation and sanitization
const { check, validationResult } = require('express-validator');

// Author Home Page Route: the author can create, review, and edit articles here
router.get("/", (req, res) => {

    // SQLite Query: creates the 'blog' table in the DB if and only if the table does not exist yet.
    var create_blog_table_query = `CREATE TABLE IF NOT EXISTS blog (id INTEGER PRIMARY KEY,`
        + `title VARCHAR(255) DEFAULT  "My Blog" NOT NULL, ` // Set default title (can be changed in Settings)
        + `subtitle VARCHAR(500) DEFAULT "Welcome to my blog!",` // Set default subtitle
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
                                            + `subtitle VARCHAR(500) DEFAULT "Undefined Subtitle",`
                                            + `content TEXT DEFAULT "", is_published BOOLEAN DEFAULT 0,`
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
                errors: null,
                blog: blog_data
            });
        }
    });
});

// Set of Rules using express-validator package to validate form data for updating the blog settings
var blogValidate = [
    // Check title
    check('title').isLength({ min: 1, max: 255}).withMessage(`Blog title must be 1-255 chars!`).trim().escape(),
    // Check subtitle
    check('subtitle').isLength({min: 0, max: 500}).withMessage(`Blog subtitle cannot be more than 500 chars!`).trim().escape(),
    // Check author
    check('author').isLength({min: 1, max: 255}).withMessage(`Author name must be 1-255 chars!`)
    .trim().escape()
];

// Settings POST Route: validates input data to change blog title/subtitle/author and updates blog table in DB
router.post("/settings", blogValidate, (req, res) => {
    
    const errors = validationResult(req);

    // Use Joi to validate author input 
    // const schema = Joi.object({
    //     // 'required' --> ensures user enters some value
    //     title: Joi.string().min(3).max(255).required(), // Set max char-value to the field's VARCHAR value from DB
    //     subtitle: Joi.string().min(1).max(500).required(),
    //     author: Joi.string().min(1).max(255).required()
    // });

    /** Unpacks result of schema validation with Joi --> error stores error details if form data is invalid
     * 'value' stores the inputted data, e.g. value.title = validated 'req.body.title' for blog title setting
    */
    // const {value, error} = schema.validate(req.body);

    // If data is invalid, send error msg to browser
    if (!errors.isEmpty()) {
        console.log(errors.array());
        // Pass the error message into the settings form .ejs file
        res.render("author/author-settings", {
            errors: errors.array(),
            blog: req.body
        });
    }
    // Data is valid --> update the DB to store new blog settings
    else {
        // Update blog settings in blog table in db
        var update_query = `UPDATE blog SET title = ?,`
            + `subtitle = ?, author = ? WHERE id = 1`;
        // Update (single) blog row in 'blog' table with values from the **validated** req.body
        db.run(update_query, [req.body.title, req.body.subtitle, req.body.author],
            function (err) {
                if (err) {
                    console.log("ERROR - could not update blog settings! " + err);
                } else {
                    // If successfully updated blog table, reload author's home page
                    res.redirect("/author/");
                }
            });
    }
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
            // Only render the article page if article was returned from SQL query!
            if (article_data){
                // Pass data about this individual draft article from DB to the edit-article view
                res.render("author/author-edit-article", {
                    /** Pass 'error' as null, as some ejs in the template only executes when 'error' NOT null
                       * but then nothing in ejs works if no 'error' variable is passed at all
                    **/
                    error: null,
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

// This is the POST route by which the author can update the article to-be-edited
router.post("/edit-article", (req, res) => {
    // TEST: fill in later!
   res.send(req.body);
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