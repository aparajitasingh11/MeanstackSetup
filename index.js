"use strict";

const app                = require('express')(),
	  express            = require('express'),
	  fs                 = require('fs'),
	  server             = require('http').Server(app),
	  database           = require('./config/database.js'),
	  bodyParser         = require('body-parser'),
	  dateTime           = require('date-time'),
	  expressValidator   = require('express-validator'),
	  custom             = require('./lib/custom.js'),
	  i18n               = require("i18n"),
	  constant           = require('./config/constant.js');
	  
/* For Validation */
app.use(expressValidator({
	customValidators: {

		/* For In List Validation */
		inList: function(value,allowed_values){
			if (allowed_values.indexOf(value) >= 0) {
			    return true;
			} else {
			    return false;
			}
		},

		/* To check minimum value */
		minValue: function(value,minValueLimit){
			if (parseInt(value) >= parseInt(minValueLimit)) {
			    return true;
			} else {
			    return false;
			}
		},

		/* To check maximum value */
		maxValue: function(value,maxValueLimit){
			if (parseInt(value) <= parseInt(maxValueLimit)) {
			    return true;
			} else {
			    return false;
			}
		}
	}
}));

/* To initialize langugage translation */
app.use(i18n.init);

i18n.configure({
    locales:['en', 'de'],
    defaultLocale: constant.default_lang,
    register: global,
    directory: __dirname + '/locales'
});

/* To set view engine */
app.set('view engine', 'ejs');

/* To set port */
app.set('port', process.env.PORT || 1117);

/* To handle invalid JSON data request */
app.use(bodyParser.json());
app.use((err, req, res, next) => {
    console.error(err); 
    let jsonErrResp = {};
  	  jsonErrResp.code = 400;
  	  jsonErrResp.response = {};
  	  jsonErrResp.status = 0;
  	  jsonErrResp.message = 'Invalid JSON request';
    if(err.status === 400)
      return res.send(jsonErrResp);
    return next(err); // if it's not a 400, let the default error handling do it. 
});

/* For parsing urlencoded data */
app.use(bodyParser.urlencoded({ extended: true }));

/* To Listen Port */
server.listen(app.get('port'), function () {
  console.log(`Express server listening on port ${app.get('port')}`);
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* For admin panel assets */
app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){
	res.send('Server started');
});
require('./apis/v1/question.js')(app, database, constant);

module.exports = { app };

/* End of file index.js */
/* Location: ./index.js */
