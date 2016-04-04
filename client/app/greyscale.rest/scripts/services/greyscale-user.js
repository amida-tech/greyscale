/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUserApi', function ($q, greyscaleRestSrv, Restangular, greyscaleTokenSrv, greyscaleBase64Srv,
        greyscaleRealmSrv, $log, greyscaleGlobals) {

        return {
            login: _login,
            logout: _logout,
            isAuthenticated: _isAuthenticated,
            get: _self,
            list: _listUsers,
            register: _register,
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
            return selfAPI().customPUT(data);
        }

        function _getOrg() {
            return orgAPI().get();
        }

        function _saveOrg(data) {
            return orgAPI().customPUT(data);
        }

        function _register(userData) {
            return Restangular.one('users').customPOST(userData);
        }

        function _checkActivationToken(token) {
            return userAPI().one('activate', token).get();
        }

        function _activate(token, data) {
            return userAPI().one('activate', token).customPOST(data);
        }

        function _listUsers(params, realm) {
            return userAPI(realm).get(params);
        }

        function _login(user, passwd) {
            return greyscaleRestSrv({
                    'Authorization': 'Basic ' + greyscaleBase64Srv.encode(user + ':' + passwd)
                })
                .one('users', 'token').get()
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
                        return $q.resolve(false);
                    });
            }
            return res;
        }

        function _logout() {
            return userAPI().one('logout').post();
        }

        function _inviteSuperAdmin(userData) {
            return userAPI(greyscaleGlobals.adminSchema).one('invite').customPOST(userData);
        }

        function _inviteAdmin(userData, realm) {
            return userAPI(realm).one('invite').customPOST(userData);
        }

        function _inviteUser(userData) {
            return orgAPI().one('invite').customPOST(userData);
        }

        function updateUser(data, realm) {
            return userAPI(realm).one(data.id + '').customPUT(data);
        }

        function delUser(id, realm) {
            return userAPI(realm).one(id + '').remove();
        }

        function _uoaAPI(userId) {
            return userAPI().one(userId + '');
        }

        function _listUoa(userId) {
            return _uoaAPI(userId).one('uoa').get();
        }

        function _addUoa(userId, uoaId) {
            return _uoaAPI(userId).one('uoa', uoaId + '').customPOST();
        }

        function _delUoa(userId, uoaId) {
            return _uoaAPI(userId).one('uoa', uoaId + '').remove();
        }

        function _remind(login) {
            return userAPI().one('forgot').customPOST({
                email: login
            });
        }

        function _resetToken(token) {
            return userAPI().one('check_restore_token', token).get();
        }

        function _resetPasswd(data) {
            return userAPI().one('reset-password').customPUT(data);
        }
    });
