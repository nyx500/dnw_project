
/**
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 */

const express = require("express");
const router = express.Router();
const assert = require('assert');
// Enables constructing path for article redirects with query string
const url = require('url');
// Import modules from express-validation for form data validation and sanitization
const { check, validationResult } = require('express-validator');
// Sanitization library to get rid of dangerous HTML code injection
const sanitizeHtml = require('sanitize-html');

// Error handling modules:
const httpStatusCodes = require('../errors/httpStatusCodes');
const Error500 = require("../errors/Error500");
const Error404 = require("../errors/Error404");
// Function which is called when Sqlite query returns 'err' and cannot process the DB request:
function returnErrorPage(res, error, optional_message=null) {
  res.status(error.statusCode).render("error", {
      error: error,
      message: optional_message
  }); // Renders the 'error' template/ejs file in the 'view' folder, passes in the Error object as variable
}


// Reader Home Page: displays blog title/subtitle/author and a list of links to published articles
router.get("/", (req, res) => {
  // Retrieve blog data from blog table (title, author etc.)
  var blog_query = `SELECT * FROM blog`;
  db.get(blog_query, function (err, blog_data) {
    if (err) {
      returnErrorPage(res, new Error500());
    } else {
      // Retrieve the articles with 'is_published set to True' & order by datetime published, most recent is first
      var articles_query = `SELECT * FROM articles WHERE is_published = 1 ORDER BY datetime_published DESC;`;
      db.all(articles_query, function (err, articles_data){
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

router.get("/article", (req, res)=> {
  var errors = [];
  if (req.query.errors)
  {
    errors = JSON.parse(req.query.errors);
    console.log(typeof(errors));
  }
  var specific_article_query = `SELECT * FROM articles WHERE id = (?);`;
  db.get(specific_article_query,[req.query.id], function (err, article){
    if (err) {
      returnErrorPage(res, new Error404(), "This article does not exist.");
    } else {
      var retrieve_comments_query = `SELECT * FROM comments WHERE article_id = (?) ORDER BY datetime_published DESC;`;
      db.all(retrieve_comments_query, [req.query.id], function (err, comments){
        if (err) {
          returnErrorPage(res, new Error500());
        } else {
          // Need to get Blog title for the navbar logo...
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
                  errors: errors
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


// /**
//  * @desc retrieves the current users
//  */
// router.get("/get-test-users", (req, res, next) => {
//   //Use this pattern to retrieve data
//   //NB. it's better NOT to use arrow functions for callbacks with this library
//   global.db.all("SELECT (user_name) FROM testUsers", function (err, rows) {
//     if (err) {
//       next(err); //send the error on to the error handler
//     } else {
//       res.json(rows);
//     }
//   });
  
// });

// /**
//  * @desc retrieves the current user records
//  */
// router.get("/get-user-records", (req, res, next) => {
//   //USE this pattern to retrieve data
//   //NB. it's better NOT to use arrow functions for callbacks with this library

//   global.db.all("SELECT * FROM testUserRecords", function (err, rows) {
//     if (err) {
//       next(err); //send the error on to the error handler
//     } else {
//       res.json(rows);
//     }
//   });
// });

// /**
//  * @desc Renders the page for creating a user record
//  */
// router.get("/create-user-record", (req, res) => {
//   res.render("user/create-user-record");
// });

// /**
//  * @desc Add a new user record to the database for user id = 1
//  */
// router.post("/create-user-record", (req, res, next) => {
//   //USE this pattern to update and insert data
//   //NB. it's better NOT to use arrow functions for callbacks with this library
//   const data = generateRandomData(10);
//   global.db.run(
//     "INSERT INTO testUserRecords ('test_record_value', 'test_user_id') VALUES( ?, ? );",
//     [data, 1],
//     function (err) {
//       if (err) {
//         next(err); //send the error on to the error handler
//       } else {
//         res.send(`New data inserted @ id ${this.lastID}!`);
//         next();
//       }
//     }
//   );
// });

// ///////////////////////////////////////////// HELPERS ///////////////////////////////////////////

// /**
//  * @desc A helper function to generate a random string
//  * @returns a random lorem ipsum string
//  */
// function generateRandomData(numWords = 5) {
//   const str =
//     "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum";

//   const words = str.split(" ");

//   let output = "";

//   for (let i = 0; i < numWords; i++) {
//     output += choose(words);
//     if (i < numWords - 1) {
//       output += " ";
//     }
//   }

//   return output;
// }

// /**
//  * @desc choose and return an item from an array
//  * @returns the item
//  */
// function choose(array) {
//   assert(Array.isArray(array), "Not an array");
//   const i = Math.floor(Math.random() * array.length);
//   return array[i];
// }

module.exports = router;
