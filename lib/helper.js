"use strict";

 var moment   = require('moment');
 var appRoot  = require('app-root-path');
 var model    = require(appRoot + '/lib/model.js');
 var custom   = require(appRoot + '/lib/custom.js');
 var constant = require(appRoot + '/config/constant.js');

 class Custom {

   /* Custom Functions Constructor */
   constructor() {
   }

  
    /**
     * To get database error response
     */
     dbErrorResponse(message){
      let dbErrorResponse = {};
      dbErrorResponse.code = 200; 
      dbErrorResponse.response = {}; 
      dbErrorResponse.status = 0; 
      if(message){
        dbErrorResponse.message = message;
      }else{
        dbErrorResponse.message = 'Database error occured.'; 
      }
      return dbErrorResponse;
    }

  }

  module.exports = new Custom();

  /* End of file custom.js */
/* Location: ./lib/custom.js */