// Class definition for 500 Error (internal server error)
// Inherits from the baseError class (which inherits from 'Error')

const httpStatusCodes = require('./httpStatusCodes');
const BaseError = require('./BaseError');

// Error500 inherits from the custom BaseError class also contained in this folder
class Error500 extends BaseError {
    constructor (
        name = '500 Error',
        statusCode = httpStatusCodes.INTERNAL_SERVER,
        description = `Internal Server Error. The server could not fulfil the request from the database.`
        + ` Please try again later!`,
        isOperational = true
    ) // end of ctor input args
    {   
        // Call BaseError constructor to add the above input args as properties
        super(name, statusCode, isOperational, description);
    }
}

module.exports = Error500;