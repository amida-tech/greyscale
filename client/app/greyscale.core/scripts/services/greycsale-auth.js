/**
 * Created by igi on 10.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .service('greyscaleAuthSrv', function (Restangular, $log, $rootScope, $q) {

        var _user = null;

        function _login(user, passwd) {
            var _res = $q.resolve(true);
            /* 2do: implement login API call*/
            _user = user;
            return _res;
        }

        function _isAuthenticated() {
            var _res = $q.resolve(_user !== null);
            /* 2do: implement authorization API call */
            return _res;
        }

        function _logout(token) {
            var _res = $q.resolve(true);
            /* 2do: implement logout API call*/
            _user = null;
            $rootScope.$emit('logout');
            return _res;
        }

        function _register(user_data) {
            return Restangular.one('users').customPOST(user_data);
        }

        function _users() {
            return $q.reject([]);
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
