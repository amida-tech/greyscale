//NODE_PATH=. node pwd.js [admin_user_email] [password]

var
    _ = require('underscore'),
    crypto = require('crypto'),
    config = require('./config'),
    User = require('./app/models/users');

var pg = require('pg');

var pgUser = config.pgConnect.user,
    pgPassword = config.pgConnect.password,
    pgHost = config.pgConnect.host,
    pgPort = config.pgConnect.port,
    pgDbName = config.pgConnect.database;

var pgConString = 'postgres://' + pgUser + ':' + pgPassword + '@' + pgHost + ':' + pgPort;

if (process.argv.length !== 4) {
    console.log("pwd.js - change user password (+ activate user)");
    console.log("Usage: NODE_PATH=. node pwd.js [user email] [new password]");
    process.exit();
}

var user = process.argv[2];
var pwd = process.argv[3];

password = User.hashPassword(pwd)

console.log("new password hash", password);

//console.log("pgConString: ", pgConString);


pg.connect(pgConString + '/' + pgDbName, function(err, client, done) {
    if (err) {
        return console.error('error fetching client from pool', err);
    }
    client.query('update "Users" set password=$1, "isActive"=TRUE, "activationToken"=NULL, "resetPasswordToken"=NULL, "resetPasswordExpires"=NULL where email=$2 ', [password, user], function(err, result) {

        if (err) {
            return console.error('error running query', err);
        }
        //console.log(result);
        process.exit();
    });

});
