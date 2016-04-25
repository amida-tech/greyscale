/**
 * Common functions using in tests
 **/

var chai = require('chai');
var expect = chai.expect;
var config = require('../../config');
var _ = require('underscore');



// make all users list
ithelper = {
    getAllUsersList: function (testEnv, keys) {
        var allUsers = [];
        if (keys.indexOf('superAdmin') !== -1){
            allUsers.push( // superAdmin
                {
                    firstName: testEnv.superAdmin.firstUser || 'SuperAdmin',
                    lastName: testEnv.superAdmin.lastUser || 'Test',
                    email: testEnv.superAdmin.email,
                    roleID: testEnv.superAdmin.roleID || 1,
                    password: testEnv.superAdmin.password
                }
            );
        }
        if (keys.indexOf('admin') !== -1) {
            allUsers.push( // admin
                {
                    firstName: testEnv.admin.firstUser || 'Admin',
                    lastName: testEnv.admin.lastUser || 'Test',
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
            user = _.find(allUsers, {roleID : role});
        } else {
            // ordinary users
            var i = _.findIndex(allUsers, {roleID : role});
            if (i !== -1 ){
                var ordinaryUsers = allUsers.slice(i);
                if (num > 0 && num <= ordinaryUsers.length) {
                    user = ordinaryUsers[num-1];
                }
            }
        }
        return user;
    },

    getUserId : function (api, get, token, status, obj, key, done) {
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

    getEssenceId : function (api, get, essenceName, token, status, obj, key, done) {
        api
            .get(get+'?tableName='+essenceName)
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

    select : function (api, get, token, status, numberOfRecords, done) {
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

    selectOneCheckField : function (api, get, token, status, name, value, done) {
        api
            .get(get)
            .set('token', token)
            .expect(status)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body).to.exist;
                expect(res.body[name]).to.equal(value);
                done();
            });
    },

    insertOne : function (api, get, token, insertItem, status, obj, key, done) {
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
    insertOneErr : function (api, get, token, insertItem, status, errCode, done) {
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
    insertOneErrMessage : function (api, get, token, insertItem, status, errCode, message, done) {
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
                expect(res.body.message).to.have.string(message);
                done();
            });
    },
    deleteOne : function (api, get, token, status, done) {
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
    checkHeaderValue : function (api, get, token, status, headerName, headerValue, done) {
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
    updateOne : function (api, get, token, updateItem, status, done) {
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
    }
};

module.exports = ithelper;
