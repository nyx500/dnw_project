
//These are the routes for the reader section of the blog

const express = require("express");
const router = express.Router();
// Enables constructing path for article redirects with query string
const url = require('url');
// Import modules from express-validation for form data validation and sanitization
const { check, validationResult } = require('express-validator');
// Sanitization library to get rid of dangerous HTML code injection
const sanitizeHtml = require('sanitize-html');

// Import error handling modules:
const httpStatusCodes = require('../errors/httpStatusCodes');
const Error500 = require("../errors/Error500");
const Error404 = require("../errors/Error404");
// A helper function which renders the error page if data cannot be retrieved/updated OR 404 error occurs
const returnErrorPage = require("../errors/errorFunction");


/**
 * Author Home Page GET Route
 * Purpose: the reader can view the blog title/subtitle/author and a list of information about published articles
 * Inputs: none
 * Outputs: renders Reader home page if there are no db errors, otherwise returns a custom error page with error 500 code
*/
router.get("/", (req, res) => {
  // Retrieves the blog data (title,subtitle,author) from blog table
  var blog_query = `SELECT * FROM blog`;
  db.get(blog_query, function (err, blog_data) {
    if (err) {
      returnErrorPage(res, new Error500());
    } else {
      // Retrieves the articles with the 'is_published; field set to True and orders them by datetime published from newest to oldest
      var articles_query = `SELECT * FROM articles WHERE is_published = 1 ORDER BY datetime_published DESC;`;
      db.all(articles_query, function (err, articles_data) {
        if (err) {
          returnErrorPage(res, new Error500());
        } else {
          res.render("reader/reader-home-page", {
            blog: blog_data,
            articles: articles_data
          });
        }
      });
    }
  });
});

/**
 * Author View Selected Article by ID GET Route
 * Purpose: the reader is taken to the page displaying a specific article by clicking on it on the Reader Home page
 * Inputs: the article ID (from req.query.id) to select the correct article from database
 * Outputs: renders Reader home page if there are no db errors, otherwise returns a custom error page with error 500 code
*/
router.get("/article", (req, res)=> {
  // Create empty 'errors' array
  var errors = [];
  // Fill up the errors array if there were error args passed in the query string (if a comment/like POST request was invalid)
  if (req.query.errors)
  { 
    // Turn the query string storing errors into an array storing errors that can be displayed in the ejs foe
    errors = JSON.parse(req.query.errors);
  }
  // Retrieves a single article  from the articles table according to id by using req.query.id
  var specific_article_query = `SELECT * FROM articles WHERE id = (?);`;
  db.get(specific_article_query,[req.query.id], function (err, article){
    // Invalid ID: display error page with 404 status code
    if (err) {
      returnErrorPage(res, new Error404(), "This article does not exist.");
    } else {
      // If article exists, search article id foreign key in the 'comments' table to retrieve all comments for that article (newest first)
      var retrieve_comments_query = `SELECT * FROM comments WHERE article_id = (?) ORDER BY datetime_published DESC;`;
      db.all(retrieve_comments_query, [req.query.id], function (err, comments){ // Retrieves all comments for that article
        if (err) {
          returnErrorPage(res, new Error500());
        } else {
          // Also retrieve the Blog title from the 'blog' table to display it on the left of the navbar
          var get_blog_title_query = `SELECT * FROM blog;`;
          db.get(get_blog_title_query, function(err, blog_data)
          {
              if (err)
              {
                returnErrorPage(res, new Error500());
              } else {
                res.render("reader/reader-article", {
                  article: article,
                  blog: blog_data,
                  comments: comments,
                  errors: errors // Validation errors when user tries to post a comment go here
                });
              }
          });
        }
      });
    }
  });
})



/** 
 * Updates the 'likes' field for an article with the posted ID in the 'articles' table by incrementing it by 1.
 * This happens when a reader clicks 'like' under the article on the View article page
 * This route works in tandem with the AJAX async call in the likes-script.js file
 * I decided to use AJAX because the user can immediately see the 'likes' being incremented without the page
 * reloading and navigating away to the top section, forcing the reader to scroll down again.
 * Without AJAX, the page would reload and user would have to scroll a lot again to see that their 'like' worked!
*/
router.post("/like-article", (req, res)=> {
  // Updates the 'likes' field for the requested article (by ID) by 1 in the 'articles' Sqlite table
  var update_likes_query = `UPDATE articles SET likes = likes + 1 WHERE id = (?)`;
  db.run(update_likes_query, [req.body.id_like_form], function (err) {
        if (err) {
          returnErrorPage(res, new Error500(), "Failed to add 'like' to article.");
        } else {
          // Likes are immediately updated via AJAX, so just send JSON status data for AJAX to continue
          res.end('{"success" : "Updated Successfully", "status" : 200}');
      };
    });
})

// Validation rules for comments
var commentValidate = [
  // Check title
  check('name').isLength({  max: 255 }).withMessage(`User's name must be less than 500 words`)
  .not().isEmpty().withMessage(`Name field cannot be empty!`).trim(),
  check('comment').isLength({ max: 1000 }).withMessage(`Comment must be less than 1000 chars!`)
  .not().isEmpty().withMessage(`Comment field cannot be empty!`).trim()
];

router.post("/post-comment", commentValidate, (req, res)=> {
  // Check for validation errors
  const errors = validationResult(req);
  // If data is invalid, send error msg to browser
  if (!errors.isEmpty()) {
    // Pass the error message into the article form .ejs file
    res.redirect(
      url.format({
          pathname: "/reader/article",
          query: {
              "id": req.body.id_comment_form, // Pass the ID of the article into the req.query object,
              "errors": JSON.stringify(errors.array())
          }
      }));
  } else {
    // SQL query to add comment to comments table, with foreign key being the ID of the article the comment belongs to
  var add_comment_query = `INSERT INTO comments (username, comment, article_id) VALUES (?, ?, ?);`
  let clean_username = sanitizeHtml(req.body.name);
  let clean_comment = sanitizeHtml(req.body.comment);
  db.run(add_comment_query, [clean_username, clean_comment, req.body.id_comment_form], function(err){
    if (err)
    {
      returnErrorPage(res, new Error500(), "Failed to post comment on article.");
    }
    else
    {
      res.redirect(url.format({
        pathname: "/reader/article",
        query: {
            "id": req.body.id_comment_form,
            errors: []
        }
      }));  
    }
  });
  }
})


module.exports = router;
