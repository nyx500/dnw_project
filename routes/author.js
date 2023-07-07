/**
 * These are example routes for the author section of the blog
 */

const express = require("express");
const router = express.Router();
const assert = require('assert');

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


//////////////////////////////// HELPER FUNCTIONS FOR CALLBACKS /////////////////////////////////////////


module.exports = router;