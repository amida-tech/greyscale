var HttpError = require('app/error').HttpError,
	moment = require('moment'),
	_ = require('underscore'),    
	Query = require('app/util').Query,
    query = new Query(),
	ClientPG = require('app/db_bootstrap'),
	users = require('app/controllers/users'),
	co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query),

module.exports = {

    backup: function (req, res, next) {
    	//get the schema to backup.
    	//determine the output type
    	//backup the db
    		//if csv then make a call per table
    		//if sql then use pg_dump
    	//zip
    	//return to client
    },

    restore: function (req, res, next) {
    	//retrieve the file
    	//determine the schema
    	//restore
    		//if csv then this can be done with the copy command on a per file basis
    		//if sql then just run it?
    	
    },

    import: function (req, res, next) {
    	
    },

    instantiate: function (req, res, next) {
    	//get the schema to populate.
    	var schemaName = req.params.realm;
    	var tablesDontExist = false;
    	var tablesNotPopulated = false;
    	
    	
        co(function* () {
            var needNewToken = false;
            var data = yield thunkQuery('SELECT COUNT(*) FROM proto_indaba.Languages', {'realm': req.param('realm')} );
            if (!data.length) {
            	//if response is 0 then the tables need to be populated
        		populateTables(schemaName);
        		//get username and password from request
        		users.insertOne(req, res, next);
        		return 1;
            }else{
            	//if response is > 0 then the tables are already populated. 
            	//do nothing
            	return 1
            }

        }).then(function (data) {
        	//do nothing for the moment.  Reserving this should I need to do post processing
        }, function (err) {
        	co(function* () {
                //tables do not exist.  
            	createTables(schemaName);    		
            	populateTables(schemaName);
        		//get username and password from request
        		users.insertOne(req, res, next);
        	});
        });
    }

};

var createTables = function(schema){
	//populate tables
	var schemaSql = fs.readFileSync('db_dump/schema.def.sql').toString();
    query(schemaSql, function (err, resp) {
        if (!err) {
            console.log('schema initialized');
        } else {
            console.log('error on schema initialization');
        }
    });
}

var populateTables = function(schema){
	//populate tables
	var dat = fs.readFileSync('db_dump/base_data.sql').toString();
	
    query(dat, function (err, resp) {
        if (!err) {
            console.log('database instantiated');
        } else {
            console.log('error on database instantiation');
        }
    });
}
