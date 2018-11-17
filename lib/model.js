"use strict";

var appRoot  = require('app-root-path'),
	custom   = require(appRoot + '/lib/custom.js'),
	settings = require(appRoot + '/db.json'),
	appConst = require(appRoot + '/config/constant.js'),
    qb = require('node-querybuilder').QueryBuilder(settings, 'mysql', 'single');

class Model {

	constructor() 
	{
		this.limit = 10;
		this.order_type = 'DESC';
	}

	/**
	 * To insert data into table
	 * @param {string} table
	 * @param {object} dataObj
	*/
    insertData(callBack,table,dataObj)
    {
    	qb.insert(table, dataObj, (err, res) => {
		    if (err){
		    	console.log(qb.last_query());
                return callBack(err, res);
		    }else{
		    	console.log(qb.last_query());
		    	return callBack(err, res);
		    }
		});
    }

    /**
	 * To insert bulk data into table
	 * @param {string} table
	 * @param {object} dataObj
	*/
    insertBulkData(callBack,table,dataObj)
    {
    	qb.insert_batch(table, dataObj, (err, res) => {
		    console.log(qb.last_query());
		    if (err){
                return callBack(err, res);
		    }else{
		    	return callBack(err, res);
		    }
		});
    }

    /**
	 * To update data into table
	 * @param {string} table
	 * @param {object} dataObj
	 * @param {object} whereObj
	*/
    updateData(callBack,table,dataObj,whereObj)
    {
    	qb.update(table, dataObj, whereObj , (err, res) => {
		    if (err){
		    	console.log(qb.last_query());
                return callBack(err, res);
		    }else{
		    	return callBack(err, res);
		    	console.log("else ", qb.last_query());
		    }
		});
    }

    /**
	 * To delete data from table
	 * @param {string} table
	 * @param {object} whereObj
	*/
    deleteData(callBack,table,whereObj)
    {
    	qb.delete(table, whereObj , (err, res) => {
		    if (err){
		    	console.log(qb.last_query());
                return callBack(err, res);
		    }else{
		    	return callBack(err, res);
		    }
		});
    }

    /**
	 * To fire custom query
	 * @param {string} query
	*/
    customQuery(callBack,query)
    {
    	qb.query(query , (err, res) => {
		    if (err){
		    	console.log(qb.last_query());
                return callBack(err, res);
		    }else{
		    	return callBack(err, res);
		    }
		});
    }


    /**
	 * To get conditional data
	 * @param {string} table
	 * @param {object} whereObj
	 * @param {string} orderField
	 * @param {string} orderType
	 * @param {string} fields
	 * @param {integer} limit
	 * @param {integer} offset
	 * @param {string} groupBy
	*/
    getAllWhere(callBack,table,whereObj,orderField,orderType,fields,limit,offset,groupBy)
    {
    	if(fields){
    		qb.select(fields);
    	}else{
    		qb.select('*');
    	}
    	if(whereObj){
    		qb.where(whereObj);
    	}
    	if(orderField && orderType){
    		qb.order_by(orderField, orderType);
    	}
    	if(limit && limit > 0){
    		qb.limit(limit);
    	}
    	if(offset && offset > 0){
    		qb.offset(offset);
    	}
    	if(groupBy){
    		qb.group_by(groupBy);
    	}
    	qb.get(table, (err,res) => {
    		if (err){
		    	console.log(qb.last_query());
                return callBack(err, res);
		    }else{
		    	return callBack(err, res);
		    }
	    });
    }

  

}

module.exports = new Model();

/* End of file model.js */
/* Location: ./lib/model.js */