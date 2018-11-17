"use strict";

 var moment   = require('moment');
 var appRoot  = require('app-root-path');
 var model    = require(appRoot + '/lib/model.js');
 var constant = require(appRoot + '/config/constant.js');

 class Custom {

   /* Custom Functions Constructor */
   constructor() {
   }

    /**
     * To generte unique number
     * @param {string} n
     */
     generateRandomNo(n) {
        let low  = 100000;
        let high = 999999;
        var finalNumber = Math.floor(Math.random() * (high - low + 1) + low);
        if(parseInt(finalNumber.length) < parseInt(n)){
            var finalNumber = this.generateRandomNo(n);
        }
        return finalNumber;
    }

    /**
     * To get current time
     */
     getCurrentTime(){
        var dateTime = require('date-time');
        return dateTime({local: false,date: new Date()});
    }


    /**
     * To generte custom ID format
     * @param {string} moduleType
     */
     generateCustomID(moduleType) {
        return moduleType + '-' + this.changeDateFormat(this.getCurrentTime(),'yyyymmddHHMMss');
    }

    /**
     * To capitalize string
     */
     capitalize(input){
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }

	/**
	 * To manage validation messages
	 * @param {object} reqData
    */
    manageValidationMessages(reqData){
    	/* Count object length */
    	var count = Object.keys(reqData).length;
    	if(count > 0){
    		for (var i = 0; i < count; i++) {
    			if(reqData[i]['msg'] != ''){
    				return reqData[i]['msg'];
    			}
    		}
    	}else{
    		return '';
    	}
    }


    /**
     * To get unique Id
     */
     getUniqueId(){
        var uniqid = require('uniqid');
        return uniqid.time('QL');
    }

    /**
     * To get offset
     * @param {integer} pageNo 
     * @param {integer} limit 
     */
     getOffset(pageNo,limit = 10){
        if(parseInt(pageNo) === 0){
            pageNo = 1;
        }
        let offsetVal = (parseInt(pageNo) - 1) * parseInt(limit);
        return parseInt(offsetVal);
    }

    /**
     * To change date time format
     * @param {string} datetime 
     * @param {string} format 
     */
     changeDateFormat(datetime,format = 'yyyy-mm-dd HH:MM:ss'){
         if(datetime){
            let dateFormat = require('dateformat');
            return dateFormat(datetime, format);
        }else{
            return '';
        }
    }

    getFormatedDate(datetime,format = 'yyyy-mm-dd'){
     if(datetime){
        let dateFormat = require('dateformat');
        return dateFormat(datetime, format);
    }else{
        return '';
    }
}



    /**
     * To handle null or undefined value
     * @param {string} value
     * @param {string} defaultValue
     */
     nullChecker(value,defaultValue = "")
     {
        if(!value){
          return defaultValue;
      }else{
       return value;
   }
}

    /**
     * To get user ip address
     */
     getUserIp(name = 'public'){
        var ip = require('ip');
        return ip.address(name);
    }

    /**
     * For get datetime difference 
     * @param {datetime} startDateTime
     * @param {datetime} endDateTime
     * @param {string} diffType
     */
     getDateTimeDifference(startDateTime,endDateTime,diffType){
        let startDate = moment(startDateTime, 'YYYY-M-DD HH:mm:ss')
        let endDate   = moment(endDateTime, 'YYYY-M-DD HH:mm:ss')
        let timeDiff  = endDate.diff(startDate, diffType);
        return parseInt(timeDiff);
    }



}

module.exports = new Custom();

/* End of file custom.js */
/* Location: ./lib/custom.js */