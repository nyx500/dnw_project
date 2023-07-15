/** A JS class which sets the basic format for custom errors. 
 * Ref to tutorial to learn how to do this in Node.js because it is not taught in the course:
 * https://sematext.com/blog/node-js-error-handling/#types-of-errors-operational-vs-programmer-errors 
*/

class BaseError extends Error {
    /**
     * Ctor --> takes in the 'isOperational' Boolean (operational errors: unexpected runtime errors)
     * Ref: op. errors are 'external circumstances that can disrupt the flow of program execution'
     * Ref: https://www.honeybadger.io/blog/errors-nodejs/
    */
    constructor (name, statusCode, isOperational, description) {

        // Inherit from base class (JS 'Error') constructor here
        super(description);

        /** Set up a 'prototype':
         *  In JS a prototype is a kind of type of hidden class all JS objects inherit from
         * Ref: https://www.w3schools.com/js/js_object_prototypes.asp
        */ 
        Object.setPrototypeOf(this, new.target.prototype); // new.target: refers to constructor object

        // Usual ctor property-setting here using the input argument list:
        this.name = name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.description = description;
        
        // Captures calls in the stack which resulted in this error, allowing for better debugging
        Error.captureStackTrace(this);
    }
}

module.exports = BaseError;