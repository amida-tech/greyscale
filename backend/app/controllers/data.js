var _ = require('underscore'),    
	Query = require('app/util').Query,
    query = new Query(),
    User = require('app/models/users'),
	co = require('co'),
    fs = require('fs'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

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
    	var schemaName = req.body.realm;
    	var tablesDontExist = false;
    	var tablesNotPopulated = false;
    	console.log('in instantiate');
        co(function* () {
            var needNewToken = false;
            //not going to get realm from param here....
            var data = yield thunkQuery('SELECT COUNT(*) FROM "proto_amida"."Languages"', {'realm': schemaName} );
            if (!data.length) {
            	console.log('populating')
            	//if response is 0 then the tables need to be populated
        		populateTables(schemaName,req, res, next);
        		return 1;
            }else{
            	//if response is > 0 then the tables are already populated. 
            	//do nothing
            	console.log('tables already populated.')
            	return 1;
            }

        }).then(function (data) {
        	//do nothing for the moment.  Reserving this should we need to do post processing
        	console.log('doing nothing');
        }, function (err) {
        	co(function* () {
        		console.log('creating tables...');
                //tables do not exist.  
            	createTables(schemaName, req, res, next); 
        		console.log('created tables');
        	}).then(function (data) {
            	//do nothing for the moment.  Reserving this should we need to do post processing
            }, function (err) {
            	console.log('error '+JSON.stringify(err));
            });
        });
    }
};


var createTables = function(schema, req, res, next){
	//set the schema with a global replace
	var schemaSql = fs.readFileSync('db_dump/schema.def.sql').toString().replace(/CLIENT_SCHEMA/g,schema);

	//create the tables
    query(schemaSql, function (err, resp) {
        if (!err) {
            console.log('schema initialized');
            populateTables(schema, req, res, next);
        } else {
            console.log('error on schema initialization');
        }
    });
};

var populateTables = function(schema, req, res, next){	
	//set the schema with a global replace	
	var dat = fs.readFileSync('db_dump/base_data.sql').toString().replace(/CLIENT_SCHEMA/g,schema);
	//populate the tables
    query(dat, function (err, resp) {
        if (!err) {
            console.log('schema data populated');
            //check to see if the fields needed for a user are present
            if (req !== undefined && req.body.email !== undefined && req.body.password !== undefined && req.body.roleID !== undefined){
            	console.log('creating user');
            	delete req.body['realm'];
            	req.body.password = User.hashPassword(req.body.password);
            	query(User.insert(req.body).returning(User.id), {'realm': schema}, function (err, resp) {
            		if (!err) {
            			//do nothing
            		}else{
            			console.log('error on user creation');
            		}
            	});
            }else
            	console.log('user creation skipped');
        } else {
            console.log('error on schema data population');
        }
    });
}
