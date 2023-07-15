/** Use this object storing status codes for custom errors when routing. 
 * Can extend this later if author password functionality is added to also store permission denied status code.
*/ 

const httpStatusCodes = {
    OK: 200,
    NOT_FOUND: 404,
    INTERNAL_SERVER: 500
}

module.exports = httpStatusCodes;