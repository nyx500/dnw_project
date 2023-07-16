/**
 * These are the routes for the author section of the blog
 */
const express = require("express");
const router = express.Router();
// Enables constructing path for article redirects with query string
const url = require('url');

// Imports for form data validation and sanitization
const { check, validationResult } = require('express-validator');
// Sanitization library to get rid of dangerous HTML code injection
const sanitizeHtml = require('sanitize-html');

// Import error handling functionality and modules from the errors subfolder
const httpStatusCodes = require('../errors/httpStatusCodes');
const Error500 = require("../errors/Error500");
const Error404 = require("../errors/Error404");
const { contentSecurityPolicy } = require("helmet");


/**
 * Author Home Page GET Route
 * Purpose: the author can create, review, and edit articles here
 * Inputs: none
 * Outputs: renders Author home page if there are no db errors, otherwise returns a custom error page
*/
router.get("/", (req, res, next) => {
    /** Retrieves the (title,subtitle,author) values from the single-row blog table in the sqlite db */
    var get_blog_data_query = `SELECT title, subtitle, author FROM blog;`;
    db.get(get_blog_data_query, function (err, blog_data) { // There should only be one row in the blog table, so use 'db.get'
        if (err) {
            returnErrorPage(res, new Error500());
        } else {
            /**
             * Now that we have the blog table details, this query retrieves all the articles from the database.
             * The articles should be sorted by the date the user last modified them with most-recent at the top.
            */
            var retrieve_articles_query = `SELECT * FROM articles ORDER BY datetime_modified DESC;`;
            // Use db.all query because we want all the articles rather than just one
            db.all(retrieve_articles_query, function (err, articles_data) {
                if (err) {
                    returnErrorPage(res, new Error500());
                } else {
                    res.render("author/author-home-page", {
                        blog: blog_data,
                        articles: articles_data,
                        // Also send the count of draft & published articles, this will display a special msg if only 0 articles exist
                        draft_count: countDraftArticles(articles_data),
                        published_count: countPublishedArticles(articles_data)
                    });
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
                returnErrorPage(res, new Error500());
            } else {
                // Pass in the blog_data as a variable called 'blog' into the ejs template
                res.render("author/author-settings", {
                    errors: [],
                    blog: blog_data
                });
            }
        });
});

// Set of Rules using express-validator package to validate form data for updating the blog settings
var blogValidate = [
    // Check title
    check('title').isLength({  max: 500 }).withMessage(`Blog title must be less than 500 words`)
    .not().isEmpty().withMessage(`Blog title field cannot be empty!`)
    .trim(),
    // Check subtitle
    check('subtitle').isLength({ max: 500 }).withMessage(`Blog subtitle must be less than 500 chars!`)
    .not().isEmpty().withMessage(`Blog subtitle field cannot be empty!`)
    .trim(),
    // Check author
    check('author').isLength({ max: 255 }).withMessage(`Author name must be less than 255 chars!`)
    .not().isEmpty().withMessage(`Author field cannot be empty!`)
    .trim()
];

// Settings POST Route: validates input data to change blog title/subtitle/author and updates blog table in DB
router.post("/settings", blogValidate, (req, res) => {

    const errors = validationResult(req);

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
        var update_query = `UPDATE blog SET title = (?),`
            + `subtitle = (?), author = (?) WHERE id = 1`;
        // Update (single) blog row in 'blog' table with values from the **validated** req.body
        var clean_title = sanitizeHtml(req.body.title);
        var clean_subtitle = sanitizeHtml(req.body.subtitle);
        var clean_author = sanitizeHtml(req.body.author);
        db.run(update_query, [clean_title, clean_subtitle, clean_author],
            function (err) {
                if (err) {
                    returnErrorPage(res, new Error500(), "Failed to save new settings.");
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
                returnErrorPage(res, new Error500(), "Failed to create a new draft article in the database.");
            } else {
                // If draft article is successfully added to 'articles' table, redirect to edit-article page...
                res.redirect(
                    url.format({
                        pathname: "/author/edit-article",
                        query: {
                            "id": this.lastID // Pass the ID of the last-created draft into req.query
                        }
                    })
                );
            }
        });
});

// This is where the author writes, amends, and publishes individual articles
router.get("/edit-article", (req, res) => {
    // First get errors from query string if there are any (for when POST form does not work)
    var errors = [];
    // If errors have been passed in as query in URL via the edit-article POST method, then extract the errors
    // from the query string and store them in the array
    if (req.query.errors)
    {   
        errors = (JSON.parse(req.query.errors).errors);
    }

    // Retrieves the individual article with the correct req.query.id from the database
    var query = `SELECT * FROM articles WHERE id = ?`; // Input: article's id from the inputted GET query string
    db.get(query, [req.query.id], function (err, article_data) {
        if (err) {
            returnErrorPage(res, new Error500());
        } else {
            // Only render the article page if article was returned from SQL query!
            if (article_data) {
                // Need to get Blog title for the navbar logo...
                var get_blog_title_query = `SELECT * FROM blog;`;
                db.get(get_blog_title_query, function(err, blog_data)
                {
                    if (err)
                    {
                        returnErrorPage(res, new Error500());
                    } else {
                        // Pass data about this individual draft article from DB to the edit-article view
                        res.render("author/author-edit-article", {
                            /** Pass 'errors' as null, as some ejs in the template only executes when 'errors' NOT null
                             * but then nothing in ejs works if no 'errors' variable is passed at all
                            **/
                            blog: blog_data,
                            article: article_data,
                            errors: errors
                        });
                    }
                });
                // No article data returned --> no such article with that ID in the database, so log the error
            } else {
                returnErrorPage(res, new Error404(), "This article does not exist.");
            }
        }
    });
});



// Set of rules using the express-validator package to validate POST form data for updating the blog settings
var articleValidate = [
    // Check article title is not empty and less than 500 chars
    check('title').not().isEmpty().withMessage(`Article title must not be empty!`)
        .isLength({ max: 500 }).withMessage(`Article title must be less than 500 chars!`).trim(),
    // Check article subtitle is not empty and less than 500 chars
    check('subtitle').not().isEmpty().withMessage(`Article subtitle must not be empty!`)
        .isLength({ max: 500 }).withMessage(`Article subtitle must be less than 500 chars!`).trim(),
    // Check article content is not empty and that does not exceed 40K chars (prevent buffer overflow) 
    check('content').not().isEmpty().withMessage(`Article content cannot be empty!`)
        .isLength({ max: 40000 }).withMessage(`Article content cannot be empty!`).trim()
];

// This is the POST route by which the author can update each individual article
router.post("/edit-article", articleValidate, (req, res) => {
    // Validates and sanitizes the req.body user input using the above articleValidate array with express-validat
    const errors = validationResult(req);
    // If data is invalid, then reload the edit-article page for the same article with error messages
    if (!errors.isEmpty()) {
        res.redirect(
            url.format({
                pathname: "/author/edit-article",
                query: {
                    "id": req.body.id, // Pass the ID of the article into the req.query object
                    "errors": JSON.stringify(errors)
                }
            })
        );
    }
    // Data is valid --> update the DB to store new article data
    else {
            // // Update the article and last-modified date in the DB
            let update_query = `UPDATE articles SET datetime_modified = CURRENT_TIMESTAMP,`
            +` title = (?), subtitle=(?), content=(?) WHERE id = (?)`;
            let clean_title = sanitizeHtml(req.body.title);
            let clean_subtitle = sanitizeHtml(req.body.subtitle);
            let clean_content = sanitizeHtml(req.body.content);
            // Article ID sent with the form in POST request using the value in the hidden input HTML element
            db.run(update_query, [clean_title, clean_subtitle, clean_content, req.body.id], function (err) {
                if (err) {
                    returnErrorPage(res, new Error500(), "Failed to save changes to the article.");
                } else {
                    res.redirect("/author/");
                }
            });
    }
});


// Deletes an article from the 'articles' table in the database
router.post("/delete-article", (req, res) => {
    // Deletes article with corresponding ID from the 'articles' table
    var delete_query = `DELETE FROM articles WHERE id = ?`;
    // Article ID sent with the form in POST request using the value in the hidden input HTML element
    db.run(delete_query, [req.body.id], function (err) {
        if (err) {
            returnErrorPage(res, new Error500(), "Failed to delete article from database.");
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
            returnErrorPage(res, new Error500(), "Failed to publish article.");
        } else {
            res.redirect("/author/");
        }
    });
});


//////////////////////////////////////////////////HELPER FUNCTIONS/////////////////////////////////////////////////////////////////////////

/**
 * This function is called when the Sqlite query returns 'err' and cannot process request
 * Input args: 'res' object to render the error page, error object, message to display on ejs page (default is null)
 * Outcome: sends back custom error page with the error and message variables
*/ 
function returnErrorPage(res, error, optional_message=null) {
    // Renders the 'error' template/ejs file and passes in the error and message variables
    res.status(error.statusCode).render("error", {
        error: error,
        message: optional_message
    }); 
}

/**
 * Counts the number of articles which are drafts from the result of select all articles query from the db  
 * Output of count is then passed to Author Home ejs page
 * If number of drafts is 0, a special message saying there are no drafts is published on the Author Home page
*/
function countDraftArticles(articles) {
    let count = 0;
    articles.forEach(article => {
        if (!article.is_published) {
            count++;
        }
    });
    return count;
}

/**
 * Counts the number of articles which have been published from the result of select all articles query from the db  
 * Output of count is then passed to Author Home ejs page
 * If number of published articles is 0, a special message saying there are no drafts is published on the Author Home page
*/
function countPublishedArticles(articles) {
    let count = 0;
    articles.forEach(article => {
        if (article.is_published) {
            count++;
        }
    });
    return count;
}


module.exports = router;