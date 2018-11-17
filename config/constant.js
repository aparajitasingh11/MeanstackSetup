"use strict";


 const dateTime = require('date-time'),
 uniqid   = require('uniqid'),
 devMode  = require('path').dirname(require.main.filename);

 var appConstant = function () {

	this.temp_code      = Math.floor(100000 + Math.random() * 900000); // 6 digit

	/* Default Messages */
	this.reply_user_subject = 'Failed please try again.';

	/* Datetime */
	this.admin_date_format = 'mmmm d, yyyy h:MM TT';
	this.app_date_format   = 'dddd, mmmm d, yyyy h:MM TT';

	/* Upload Files */
	this.file_upload_path  = __dirname + '/uploads/';
	this.random_image_name = 'user-'+ uniqid.time() + '-' + new Date().getTime();


	this.camtestId = 2;
	return this;
}

module.exports = new appConstant();

/* End of file constant.js */
/* Location: ./config/constant.js */