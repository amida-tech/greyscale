var HttpError = require('app/error').HttpError,
	moment = require('moment'),
	_ = require('underscore'),    
	Query = require('app/util').Query,
    query = new Query(),
	ClientPG = require('app/db_bootstrap');

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
    	
    	//check to see if the tables have been created
    	query('SELECT COUNT(*) FROM '+schemaName+'.Languages', function(err, resp) {
    		//if response is error then tables need to be created
    		//if response is 0 then the tables need to be populated
    		//if response is > 0 then the tables are already populated.
    	});
    	
    	if (tablesDontExist){
    		createTables(schemaName);
    	}
    	
    	if (tablesNotPopulated){
    		populateTables(schemaName);
    	}
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
