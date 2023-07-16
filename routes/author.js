//These are the routes for the author section of the blog

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
// A helper function which renders the error page if data cannot be retrieved/updated OR 404 error occurs
const returnErrorPage = require("../errors/errorFunction");
const { contentSecurityPolicy } = require("helmet");


/**
 * Author Home Page GET Route
 * Purpose: the author can create, review, and edit articles here
 * Inputs: none
 * Outputs: renders Author home page if there are no db errors, otherwise returns a custom error page with error 500 code
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


/**
 * Author Settings Page GET Route
 * Purpose: the author can change the blog title, subtitle and author name here
 * Inputs: none
 * Outputs: renders Author settings page if there are no db errors, otherwise returns a custom error page
*/
router.get("/settings", (req, res) => {
    /* Query which retrieves the first row of the blog table, which stores the blog title/subtitle/author (table should only have one row) */
    db.get("SELECT title, subtitle, author FROM blog;",
        function (err, blog_data) { // Callback has 2 args: error and data
            if (err) {
                returnErrorPage(res, new Error500());
            } else {
                // Pass in the blog_data as a variable called 'blog' into the ejs template
                res.render("author/author-settings", {
                    errors: [], // No errors for GET route (no form posted yet!)
                    blog: blog_data
                });
            }
        });
});

// Express-Validator Array: stores the set of rules that the req.body data (to update blog details) has to meet for new settings to be valid
var blogValidate = [
    // Check title input is not more than 500 chars and that it is not empty. 'trim()' trims trailing whitespace
    check('title').isLength({ max: 500 }).withMessage(`Blog title must be less than 500 words`)
        .not().isEmpty().withMessage(`Blog title field cannot be empty!`)
        .trim(),
    // Check subtitle input is not more than 500 chars and that it is not empty
    check('subtitle').isLength({ max: 500 }).withMessage(`Blog subtitle must be less than 500 chars!`)
        .not().isEmpty().withMessage(`Blog subtitle field cannot be empty!`)
        .trim(),
    // Check author input is not more than 255 chars and that it is not empty
    check('author').isLength({ max: 255 }).withMessage(`Author name must be less than 255 chars!`)
        .not().isEmpty().withMessage(`Author field cannot be empty!`)
        .trim()
];

/**
 * Author Settings Page POST Route
 * Purpose: validates author's form data to change blog title/subtitle/author and if valid, updates the blog details in the blog table
 * Inputs: req.body from the form on the Author Settings page, containing title, subtitle and author fields,
 * and the express-validator blogValidate ruleset for the incoming form data.
 * Outputs: if form data is invalid, re-renders the Settings page with the error messages passed as variables.
 * Else, if form data is valid, then redirects to Author Home page if settings are saved successfully,
 * otherwise returns a custom error page saying that could not save new settings to database.
*/
router.post("/settings", blogValidate, (req, res) => { // Remember to pass the express-validator rule set as second input arg
    // Stores outcome of express-validator validation
    const errors = validationResult(req);
    // If there are some errors, send back the same Settings page but with errors passed as a variable
    if (!errors.isEmpty()) {
        // If errors, re-render the Settings form again
        res.render("author/author-settings", {
            errors: errors.array(), // Pass errors onto Settings page and display them
            blog: req.body
        });
    }
    // IF data is valid (the errors outcome is empty), then update the DB to store new blog settings
    else {
        // Updates the new blog settings sent in req.body to the single row in the blog table
        var update_query = `UPDATE blog SET title = (?), subtitle = (?), author = (?) WHERE id = 1`;
        // Sanitize POST data to prevent HTML injection/XSS attacks
        var clean_title = sanitizeHtml(req.body.title);
        var clean_subtitle = sanitizeHtml(req.body.subtitle);
        var clean_author = sanitizeHtml(req.body.author);
        // Saves the sanitized new blog settings in the first/only row of the blog table
        db.run(update_query, [clean_title, clean_subtitle, clean_author],
            function (err) {
                if (err) {
                    returnErrorPage(res, new Error500(), "Failed to save new settings.");
                } else {
                    // If the blog settings are saved successfuly, reload the Author Home page
                    res.redirect("/author/");
                }
            });
    }
});


/**
 * Create New Article GET Route
 * Purpose: create a new entry/article in the 'articles' table in the database
 * Inputs: none
 * Outcome: creates a new article entry in 'articles' table, then redirects to the edit page for the new article
*/
router.get("/create-new-draft-article", (req, res) => {
    // Inserts a new article into the 'articles' table using the default values for an article defined in schema
    var insert_query = `INSERT INTO articles DEFAULT VALUES;`;
    db.run(insert_query,
        function (err) {
            if (err) {
                returnErrorPage(res, new Error500(), "Failed to create a new draft article in the database.");
            } else {
                // If the draft article is successfully added to 'articles' table, then go to the edit page to begin editing that article
                res.redirect(
                    url.format({
                        pathname: "/author/edit-article",
                        // To go to the right edit-article page, pass in the ID of the article just-added to the db in the req.query parameter
                        query: {
                            "id": this.lastID
                        }
                    })
                );
            }
        });
});

/**
 * Edit Article GET Route
 * Purpose: allows the author to edit and update the title, subtitle, content of an article with a specific ID
 * Inputs: req.query.id provides the ID in the database of the article to retrieve and edit
 * Outcome: renders the edit-article page for a specific article defined by ID
*/
router.get("/edit-article", (req, res) => {
    // Stores the errors from query string if there are any (will be sent in here if POST did not work when user tries to update article)
    var errors = []; // If no errors, this will stay empty
    // If some errors have been passed in as query in URL in the edit-article POST method when redirected here, then extract the errors
    if (req.query.errors) {
        // Converts query string storing errors into an array
        errors = (JSON.parse(req.query.errors).errors);
    }
    // Query retrieves the individual article with the correct req.query.id from the database
    var query = `SELECT * FROM articles WHERE id = ?`;
    // Query input: article's id from the inputted GET query string
    db.get(query, [req.query.id], function (err, article_data) { // Use db.get --> single article entry
        if (err) {
            returnErrorPage(res, new Error500());
        } else {
            if (article_data) {
                // If article data is successfully retrieved from the 'articles' table, then also retrieve the blog data from the 'blog' table
                var get_blog_title_query = `SELECT * FROM blog;`;
                db.get(get_blog_title_query, function (err, blog_data) {
                    if (err) {
                        returnErrorPage(res, new Error500());
                    } else {
                        // Pass  the data about this individual draft article from the database to the edit-article view
                        res.render("author/author-edit-article", {
                            blog: blog_data,
                            article: article_data,
                            // Array storing errors if user tried to update article with POST method but inputted data was invalid
                            errors: errors
                        });
                    }
                });
                // No article data returned --> no such article with that ID in the database, so return 404 custom error page
            } else {
                returnErrorPage(res, new Error404(), "This article does not exist.");
            }
        }
    });
});

// Express-Validator Array: stores a set of rules that the req.body data (to edit article) has to meet to be validated
var articleValidate = [
    // Check article title is not empty and less than 500 chars
    check('title').not().isEmpty().withMessage(`Article title must not be empty!`)
        .isLength({ max: 500 }).withMessage(`Article title must be less than 500 chars!`).trim(),
    // Check article subtitle is not empty and less than 500 chars
    check('subtitle').not().isEmpty().withMessage(`Article subtitle must not be empty!`)
        .isLength({ max: 500 }).withMessage(`Article subtitle must be less than 500 chars!`).trim(),
    // Check article content is not empty and that does not exceed 40K chars (to prevent buffer overflow) 
    check('content').not().isEmpty().withMessage(`Article content cannot be empty!`)
        .isLength({ max: 40000 }).withMessage(`Article content cannot be empty!`).trim()
];

/**
 * Author Settings Page POST Route
 * Purpose: allows user to update and save changes to an individual article, e.g. title, subtitle, content
 * Inputs: req.body from the posted form --> article ID, title, subtitle, content
 * Outputs: if form data is invalid, re-renders the same Edit Article page with the error messages passed as variables.
 * Else, if form data is valid, then redirects to Author Home page if article saved successfully,
 * otherwise returns a custom error page saying that could not update and save the article to database.
*/
router.post("/edit-article", articleValidate, (req, res) => {
    // Validates  the req.body user input using the above articleValidate array with express-validator
    const errors = validationResult(req);
    // If the posted data is invalid, then reload the edit-article page for the same article with error messages
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
    // If data is valid --> update the DB to save the new article data
    else {
        /**
         * Query updates the title, subtitle and author fields for this specific article in the 'articles' table 
         * and changes the datetime_modified timestamp to now
        */
        let update_query = `UPDATE articles SET datetime_modified = CURRENT_TIMESTAMP,`
            + ` title = (?), subtitle=(?), content=(?) WHERE id = (?)`;
        // Sanitize POST data to prevent HTML injection/XSS attacks
        let clean_title = sanitizeHtml(req.body.title);
        let clean_subtitle = sanitizeHtml(req.body.subtitle);
        let clean_content = sanitizeHtml(req.body.content);
        // Run the update query using the article id sent from the hidden input in the edit-article form
        db.run(update_query, [clean_title, clean_subtitle, clean_content, req.body.id], function (err) {
            if (err) {
                returnErrorPage(res, new Error500(), "Failed to save changes to the article.");
            } else {
                res.redirect("/author/"); // Go back to Author Home page if successfully edited the article
            }
        });
    }
});


/**
 * Author Delete Article POST Route
 * Purpose: allows user to delete a specific article from the 'articles' table in the database
 * Inputs: req.body.id storing article's id
 * Outputs: redirects to Author Home page if article deleted successfully,
 * otherwise returns a customs error page saying that could not delete the article from the database.
*/
router.post("/delete-article", (req, res) => {
    // Deletes article with corresponding ID (sent from the hidden form input) from the 'articles' table
    var delete_query = `DELETE FROM articles WHERE id = ?`;
    db.run(delete_query, [req.body.id], function (err) {
        if (err) {
            returnErrorPage(res, new Error500(), "Failed to delete article from database.");
        } else {
            // Redirect to author home page
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