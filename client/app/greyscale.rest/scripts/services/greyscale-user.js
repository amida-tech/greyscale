/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUserSrv', function (greyscaleRestSrv, Restangular, greyscaleTokenSrv, greyscaleBase64Srv, $log) {

        return {
            login: _login,
            logout: _logout,
            isAuthenticated: _isAuthenticated,
            get: _self,
            list: _listUsers,
            register: _register,
            invite: _inviteUser,
            activate: _activate,
            checkActivationToken: _checkActivationToken,
            getOrganization: _getOrg,
            saveOrganization: _saveOrg
        };

        function _auth_err_handler(err) {
            $log.debug(err);
            return $q.reject(err);
        }

        function _organization() {
            return greyscaleRestSrv()
                .one('users', 'self')
                .one('organization');
        }

        function _self() {
            return greyscaleRestSrv().one('users', 'self').get()
        }

        function _getOrg() {
            return _organization().get();
        }

        function _saveOrg(data) {
            return _organization().customPUT(data);
        }


        function _register(user_data) {
            return Restangular.one('users').customPOST(user_data);
        }

        function _checkActivationToken(token) {
            return Restangular.one('users').one('activate', token).get();
        }

        function _activate(token, data) {
            return Restangular.one('users').one('activate', token).customPOST(data);
        }

        function _listUsers(params) {
            return greyscaleRestSrv().one('users').get(params);
        }

        function _login(user, passwd) {
            return greyscaleRestSrv({'Authorization': 'Basic ' + greyscaleBase64Srv.encode(user + ':' + passwd)})
                .one('users', 'token').get()
                .then(function (resp) {
                    greyscaleTokenSrv(resp.token);
                    return resp;
                })
                .catch(_auth_err_handler);
        }

        function _isAuthenticated() {
            var _token = greyscaleTokenSrv();
            var res = $q.resolve(false);
            if (_token) {
                res = greyscaleRestSrv().one('users', 'checkToken').one(_token).get()
                    .then(function () {
                        return true;
                    })
                    .catch(function () {
                        return $q.resolve(false);
                    });
            }
            return res;
        }

        function _logout() {
            return greyscaleRestSrv().one('users', 'logout').post()
                .catch(_auth_err_handler);
        }

        function _inviteUser(user_data) {
            return greyscaleRestSrv().one('users').one('invite').customPOST(user_data);
        }
    });
