/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUserApi', function ($q, greyscaleRestSrv, greyscaleTokenSrv, greyscaleBase64Srv,
        greyscaleRealmSrv, greyscaleGlobals, greyscaleUtilsSrv, $cacheFactory) {

        var entry = 'API.USER';
        var _noCacheCfg = {
            cache: false
        };

        return {
            login: _login,
            logout: _logout,
            isAuthenticated: _isAuthenticated,
            get: _self,
            list: _listUsers,
            inviteSuperAdmin: _inviteSuperAdmin,
            inviteAdmin: _inviteAdmin,
            inviteUser: _inviteUser,
            activate: _activate,
            checkActivationToken: _checkActivationToken,
            getOrganization: _getOrg,
            saveOrganization: _saveOrg,
            save: _save,
            update: updateUser,
            delete: delUser,
            listUoa: _listUoa,
            addUoa: _addUoa,
            delUoa: _delUoa,
            remindPasswd: _remind,
            resetToken: _resetToken,
            resetPasswd: _resetPasswd
        };

        function _prepareData(resp) {
            if (resp) {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function orgAPI() {
            return selfAPI().one('organization');
        }

        function userAPI(realm) {
            return greyscaleRestSrv.api({}, realm).one('users');
        }

        function selfAPI() {
            return userAPI().one('self');
        }

        function _self(realm) {
            return userAPI(realm).one('self').get();
        }

        function _save(data) {
            return selfAPI().customPUT(data)
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'UPDATE', entry);
                });

        }

        function _getOrg() {
            return orgAPI().get()
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'GET', entry);
                });
        }

        function _saveOrg(data) {
            return orgAPI().customPUT(data)
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'UPDATE', entry);
                });
        }

        function _checkActivationToken(token) {
            return userAPI()
                .one('activate', token)
                .withHttpConfig(_noCacheCfg)
                .customGET(null, {
                    ts: (new Date()).getTime()
                })
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'GET', entry);
                });
        }

        function _activate(token, data) {
            return userAPI().one('activate', token).customPOST(data).then(_prepareData);
        }

        function _listUsers(params, realm) {
            return userAPI(realm).get(params)
                .then(_prepareData)
                .then(function (resp) {
                    var i,
                        qty = resp.length;

                    for (i = 0; i < qty; i++) {
                        resp[i].fullName = greyscaleUtilsSrv.getUserName(resp[i]);
                    }

                    return resp;
                })
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'GET', entry);
                });
        }

        function _login(user, passwd) {
            return greyscaleRestSrv.api({
                    'Authorization': 'Basic ' + greyscaleBase64Srv.encode(user + ':' + passwd)
                })
                .one('users', 'token')
                .withHttpConfig(_noCacheCfg)
                .customGET(null, {
                    ts: (new Date()).getTime()
                })
                .then(_prepareData)
                .then(function (resp) {
                    greyscaleTokenSrv(resp.token);
                    greyscaleRealmSrv.init(resp.realm);
                    return resp;
                });
        }

        function _isAuthenticated(realm) {
            var _token = greyscaleTokenSrv();
            var res = $q.resolve(false);
            if (_token) {
                res = userAPI(realm).one('checkToken', _token)
                    .withHttpConfig(_noCacheCfg)
                    .customGET(null, {
                        ts: (new Date()).getTime()
                    })
                    .then(function () {
                        return true;
                    })
                    .catch(function () {
                        greyscaleTokenSrv(null);
                        return false;
                    });
            }
            return res;
        }

        function _logout() {
            return userAPI(greyscaleRealmSrv.origin()).one('logout').post()
                .catch(function () {
                    return false;
                })
                .finally(_resetHttpCache);
        }

        function _inviteSuperAdmin(userData) {
            return userAPI(greyscaleGlobals.adminSchema).one('invite')
                .customPOST(userData)
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'ADD', entry);
                });
        }

        function _inviteAdmin(userData, realm) {
            return userAPI(realm).one('invite').customPOST(userData)
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'ADD', entry);
                });
        }

        function _inviteUser(userData) {
            return orgAPI().one('invite').customPOST(userData)
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'ADD', entry);
                });
        }

        function updateUser(data, realm) {
            return userAPI(realm).one(data.id + '').customPUT(data)
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'UPDATE', entry);
                });
        }

        function delUser(id, realm) {
            return userAPI(realm).one(id + '').remove()
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'DELETE', entry);
                });
        }

        function _uoaAPI(userId) {
            return userAPI().one(userId + '');
        }

        function _listUoa(userId) {
            return _uoaAPI(userId).one('uoa').get().then(_prepareData);
        }

        function _addUoa(userId, uoaId) {
            return _uoaAPI(userId).one('uoa', uoaId + '').customPOST().then(_prepareData);
        }

        function _delUoa(userId, uoaId) {
            return _uoaAPI(userId).one('uoa', uoaId + '').remove().then(_prepareData);
        }

        function _remind(login) {
            return userAPI().one('forgot').customPOST({
                    email: login
                })
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'GET', entry);
                });
        }

        function _resetToken(token) {
            return userAPI().one('check_restore_token', token).get()
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'GET', entry);
                });
        }

        function _resetPasswd(data) {
            return userAPI().one('reset-password').customPUT(data)
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'UPDATE', entry);
                });
        }

        function _resetHttpCache() {
            var _httpCache;
            try {
                _httpCache = $cacheFactory.get('$http');
            } catch (e) {}

            if (_httpCache) {
                _httpCache.removeAll();
            }
        }
    });
