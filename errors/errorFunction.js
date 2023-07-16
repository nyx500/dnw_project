
/**
 * This function is called in a route whenever the sqlite query returns 'err' and cannot process request.
 * Input args: 'res' object to render the error page, error object, message to display on ejs page (default is null)
 * Outcome: sends back custom error page with the error and message variables
*/
function returnErrorPage(res, error, optional_message = null) {
    // Renders the 'error' template/ejs file and passes in the error and message variables
    res.status(error.statusCode).render("error", {
        error: error,
        message: optional_message
    });
}

module.exports = returnErrorPage;