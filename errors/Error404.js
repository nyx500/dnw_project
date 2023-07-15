// Class definition for 404 Error (resource not found)
// Inherits from the baseError class (which inherits from 'Error')

const httpStatusCodes = require('./httpStatusCodes');
const BaseError = require('./BaseError');

// Error404 inherits from the custom BaseError class also contained in this folder
class Error404 extends BaseError {
    constructor (
        name = '404 Error',
        statusCode = httpStatusCodes.NOT_FOUND,
        description = 'The page you are looking for does not exist!',
        isOperational = true
    ) // end of ctor input args
    {   
        // Call BaseError constructor to add the above input args as properties
        super(name, statusCode, isOperational, description);
    }
}

module.exports = Error404;