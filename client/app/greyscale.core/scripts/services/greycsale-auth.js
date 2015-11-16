/**
 * Created by igi on 10.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .factory('greyscaleAuthSrv', function ($rootScope, $q, Restangular, greyscaleTokenSrv, greyscaleProfileSrv, $log) {

        var _auth_err_handler = function (err) {
            greyscaleProfileSrv.logout();
            return $q.reject(err);
        };

        function _login(user, passwd) {
            Restangular.setDefaultHeaders({'Authorization': 'Basic ' + btoa(user + ':' + passwd)});
            return Restangular
                .one('users','token')
                .get()
                .then(function (resp) {
                    $log.debug(greyscaleProfileSrv);
                    greyscaleProfileSrv.token(resp.token);
                    return resp;
                })
                .catch(_auth_err_handler);
        }

        function _isAuthenticated() {
            return $q.resolve(greyscaleProfileSrv.token() !== null);
        }

        function _logout(token) {
            return greyscaleTokenSrv
                .one('users')
                .post('logout')
                .finally(greyscaleProfileSrv.logout);
        }

        function _register(user_data) {
            return Restangular
                .one('users')
                .customPOST(user_data);
        }

        function _users() {
            return greyscaleTokenSrv
                .one('users')
                .get()
                .catch(_auth_err_handler);
        }

        function _roles() {
            return Restangular.one('roles').get();
        }

        return {
            register: _register,
            login: _login,
            logout: _logout,
            isAuthenticated: _isAuthenticated,
            users: _users,
            roles: _roles
        };
    });
