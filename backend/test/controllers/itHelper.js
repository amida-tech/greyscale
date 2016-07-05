/**
 * Common functions using in tests
 **/

var chai = require('chai');
var expect = chai.expect;
var config = require('../../config');
var _ = require('underscore');
var request = require('superagent');
var exec = require('child_process').exec;
var co = require('co');

var backendServerDomain = 'http://localhost'; // ToDo: to config
var apiBase = backendServerDomain + ':' + config.port + '/' + config.pgConnect.adminSchema + '/v0.2';

// make all users list
var ithelper = {
    getAllUsersList: function (testEnv, keys) {
        var allUsers = [];
        if (keys.indexOf('superAdmin') !== -1) {
            allUsers.push( // superAdmin
                {
                    firstName: testEnv.superAdmin.firstName || 'SuperAdmin',
                    lastName: testEnv.superAdmin.lastName || 'Test',
                    email: testEnv.superAdmin.email,
                    roleID: testEnv.superAdmin.roleID || 1,
                    password: testEnv.superAdmin.password
                }
            );
        }
        if (keys.indexOf('admin') !== -1) {
            allUsers.push( // admin
                {
                    firstName: testEnv.admin.firstName || 'Admin',
                    lastName: testEnv.admin.lastname || 'Test',
                    email: testEnv.admin.email,
                    roleID: testEnv.admin.roleID || 2,
                    password: testEnv.admin.password
                }
            );
        }
        // users
        if (keys.indexOf('users') !== -1) {
            for (var i in testEnv.users) {
                allUsers.push(testEnv.users[i]);
            }
        }
        return allUsers;
    },

    getUser: function (allUsers, role, num) {
        var user = allUsers[0]; // first user - default
        if (role < 3) {
            user = _.find(allUsers, {
                roleID: role
            });
        } else {
            // ordinary users
            var j = 0;
            for (var i in allUsers) {
                if (allUsers[i].roleID === role) {
                    j++;
                    if (num > 0 && num === j) {
                        user = allUsers[i];
                        break;
                    }
                }
            }
        }
        return user;
    },

    getUserId: function (api, get, token, status, obj, key, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                obj[key] = res.body.id;
                done();
            });
    },

    getEssenceId: function (api, get, essenceName, token, status, obj, key, done) {
        api
            .get(get + '?tableName=' + essenceName)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                obj[key] = res.body[0].id;
                done();
            });
    },

    selectCount: function (api, get, token, status, numberOfRecords, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.exist;
                expect(res.body.length).to.equal(numberOfRecords);
                done();
            });
    },

    getCheckRights: function (api, get, token, status, errCode, message, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.e).to.equal(errCode);
                expect(res.body.message).to.have.string(message);
                done();
            });
    },

    anyRequest: function (api, token, body, status, response, done) {
        api
            .set('token', token)
            .send(body)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                response.body = res.body;
                done();
            });
    },

    selectOneCheckField: function (api, get, token, status, index, name, value, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.exist;
                if (index !== null && index >= 0) {
                    expect(res.body[index][name]).to.equal(value);
                } else {
                    expect(res.body[name]).to.equal(value);
                }
                done();
            });
    },

    selectOneCheckFields: function (api, get, token, status, index, checkObj, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.exist;

                for (var key in checkObj) {
                    if (index !== null && index >= 0) {
                        expect(res.body[index][key]).to.equal(checkObj[key]);
                    } else {
                        expect(res.body[key]).to.equal(checkObj[key]);
                    }
                }
                done();
            });
    },

    selectCheckAllRecords: function (api, get, token, status, checkArray, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.exist;

                for (var i = 0; i < checkArray.length; i++) {
                    for (var key in checkArray[i]) {
                        if (Array.isArray(checkArray[i][key])) {
                            for (var j in checkArray[i][key]) {
                                expect(res.body[i][key][j],
                                    '[' + i + '].' + key +'[' + j + ']'
                                ).to.equal(checkArray[i][key][j]);
                            }
                        } else {
                            expect(res.body[i][key],
                                '[' + i + '].' + key
                            ).to.equal(checkArray[i][key]);
                        }
                    }
                }
                done();
            });
    },

    selectCheckAllRecords4Key: function (api, get, token, status, checkArray, resKey, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.exist;

                for (var i = 0; i < checkArray.length; i++) {
                    for (var key in checkArray[i]) {
                        if (Array.isArray(checkArray[i][key])) {
                            for (var j in checkArray[i][key]) {
                                expect(res.body[resKey][i][key][j],
                                    '[' + i + '].' + key +'[' + j + ']'
                                ).to.equal(checkArray[i][key][j]);
                            }
                        } else {
                            expect(res.body[resKey][i][key],
                                resKey + '[' + i + '].' + key
                            ).to.equal(checkArray[i][key]);
                        }
                    }
                }
                done();
            });
    },

    selectErrMessage: function (api, get, token, status, errCode, message, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.e).to.equal(errCode);
                //expect(res.body.message).to.have.string(message);
                expect(res.body.message).to.match(new RegExp(message, 'ig'));
                done();
            });
    },

    insertOne: function (api, get, token, insertItem, status, obj, key, done) {
        api
            .post(get)
            .set('token', token)
            .send(insertItem)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                obj[key] = res.body.id;
                done();
            });
    },
    insertOneErr: function (api, get, token, insertItem, status, errCode, done) {
        api
            .post(get)
            .set('token', token)
            .send(insertItem)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.e).to.equal(errCode);
                done();
            });
    },
    insertOneErrMessage: function (api, get, token, insertItem, status, errCode, message, done) {
        api
            .post(get)
            .set('token', token)
            .send(insertItem)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.e).to.equal(errCode);
                //expect(res.body.message).to.have.string(message);
                expect(res.body.message).to.match(new RegExp(message, 'ig'));
                done();
            });
    },
    deleteOne: function (api, get, token, status, done) {
        api
            .delete(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                done();
            });
    },
    deleteOneErrMessage: function (api, get, token, status, errCode, message, done) {
        api
            .delete(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.e).to.equal(errCode);
                //expect(res.body.message).to.have.string(message);
                expect(res.body.message).to.match(new RegExp(message, 'ig'));
                done();
            });
    },
    checkHeaderValue: function (api, get, token, status, headerName, headerValue, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .expect(headerName, headerValue)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                //expect(res.headers['X-Total-Count'], 2);
                done();
            });
    },
    update: function (api, get, token, updateItem, status, result, done) {
        api
            .put(get)
            .set('token', token)
            .send(updateItem)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                result.body = res.body;
                done();
            });
    },

    updateOne: function (api, get, token, updateItem, status, done) {
        api
            .put(get)
            .set('token', token)
            .send(updateItem)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                done();
            });
    },

    updateOneErrMessage: function (api, get, token, updateItem, status, errCode, message, done) {
        api
            .put(get)
            .set('token', token)
            .send(updateItem)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.e).to.equal(errCode);
                //expect(res.body.message).to.have.string(message);
                expect(res.body.message).to.match(new RegExp(message, 'ig'));
                done();
            });
    },

    doSql: function (scriptFile, realm, done) {
        var cpg = config.pgConnect;
        var connectStringPg = ' -h ' + cpg.host + ' -U ' + cpg.testuser + ' --set=schema=' + realm;
        exec('psql ' + connectStringPg + ' -d ' + cpg.database + ' -f ' + scriptFile, function (err, stdout, stderr) {
            if (err) {
                //console.log('exec error: ' + err);
                done(err);
            } else if (stderr.length > 0) {
                //console.log('stderr: '+stderr);
                done(stderr);
            } else {
                //console.log('stdout: '+stdout);
                done();
            }
        });
    },

    checkArrObjArr: function (arrChecked, arrExpected, done) {
        for (var i = 0; i < arrExpected.length; i++) {
            for (var key in arrExpected[i]) {
                if (Array.isArray(arrExpected[i][key])) {
                    for (var j in arrExpected[i][key]) {
                        expect(arrChecked[i][key][j],
                            '[' + i + '].' + key +'[' + j + ']'
                        ).to.equal(arrExpected[i][key][j]);
                    }
                } else {
                    expect(arrChecked[i][key],
                        '[' + i + '].' + key
                    ).to.equal(arrExpected[i][key]);
                }
            }
        }
        done();
    },


    getTokens: function (usersArray) {
        return new Promise((resolve, reject) => {
            co(function* () {
                for (var i in usersArray) {
                    var token = yield new Promise((authRes, authRej) => {
                        request
                            .get(apiBase + '/users/token')
                            .set(
                                'Authorization',
                                'Basic ' + new Buffer(
                                    usersArray[i].email +
                                    ':' +
                                    usersArray[i].password
                                ).toString('base64')
                            )
                            .end(function (err, res) {
                                if (err) {
                                    authRej(err);
                                }
                                authRes(res.body.token);
                            });
                    });
                    usersArray[i].token = token;
                }
                return usersArray;
            }).then(
                (res) => resolve(res),
                (err) => reject(err)
            );
        });
    }

};

module.exports = ithelper;
