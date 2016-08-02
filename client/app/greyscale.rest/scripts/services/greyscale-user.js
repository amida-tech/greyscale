/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUserApi', function ($q, greyscaleRestSrv, greyscaleTokenSrv, greyscaleBase64Srv,
        greyscaleRealmSrv, greyscaleGlobals, greyscaleUtilsSrv) {

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
            return greyscaleRestSrv({}, realm).one('users');
        }

        function selfAPI() {
            return userAPI().one('self');
        }

        function _self(realm) {
            return userAPI(realm).one('self').get();
        }

        function _save(data) {
            return selfAPI().customPUT(data).then(_prepareData);
        }

        function _getOrg() {
            return orgAPI().get().then(_prepareData);
        }

        function _saveOrg(data) {
            return orgAPI().customPUT(data).then(_prepareData);
        }

        function _checkActivationToken(token) {
            return userAPI().one('activate', token).get().then(_prepareData);
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
                });
        }

        function _login(user, passwd) {
            return greyscaleRestSrv({
                    'Authorization': 'Basic ' + greyscaleBase64Srv.encode(user + ':' + passwd)
                })
                .one('users', 'token').get()
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
                res = userAPI(realm).one('checkToken', _token).get()
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
                });
        }

        function _inviteSuperAdmin(userData) {
            return userAPI(greyscaleGlobals.adminSchema).one('invite')
                .customPOST(userData)
                .then(_prepareData);
        }

        function _inviteAdmin(userData, realm) {
            return userAPI(realm).one('invite').customPOST(userData).then(_prepareData);
        }

        function _inviteUser(userData) {
            return orgAPI().one('invite').customPOST(userData).then(_prepareData);
        }

        function updateUser(data, realm) {
            return userAPI(realm).one(data.id + '').customPUT(data).then(_prepareData);
        }

        function delUser(id, realm) {
            return userAPI(realm).one(id + '').remove();
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
                .then(_prepareData);
        }

        function _resetToken(token) {
            return userAPI().one('check_restore_token', token).get().then(_prepareData);
        }

        function _resetPasswd(data) {
            return userAPI().one('reset-password').customPUT(data).then(_prepareData);
        }
    });
