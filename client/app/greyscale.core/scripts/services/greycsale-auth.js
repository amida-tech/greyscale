/**
 * Created by igi on 10.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .factory('greyscaleAuthSrv', function ($rootScope, $q, Restangular, $log, $cookieStore,
                                           greyscaleRestSrv, greyscaleProfileSrv, greyscaleBase64Srv) {

        var _auth_err_handler = function (err) {
//            greyscaleProfileSrv.logout();
            $log.debug(err);
            return $q.reject(err);
        };

        function _login(user, passwd) {
            return greyscaleRestSrv({'Authorization': 'Basic ' + greyscaleBase64Srv.encode(user + ':' +  passwd)})
                .one('users','token')
                .get()
                .then(function (resp) {
                    greyscaleProfileSrv.token(resp.token);
                    return resp;
                })
                .catch(_auth_err_handler);
        }

        function _isAuthenticated() {
            return $q.resolve(greyscaleProfileSrv.token() !== undefined);
        }

        function _logout(token) {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('users','logout')
                .post()
                .then(greyscaleProfileSrv.logout)
                .catch(_auth_err_handler);
//                .finally(greyscaleProfileSrv.logout);
        }

        function _self() {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('users','self')
                .get()
                .then(function(resp){
                    return resp;
                })
                .catch(_auth_err_handler);
        }

        function _clients() {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('users')
                .get({'roleID':2})
                .then(function(resp){
                    return resp;
                })
                .catch(_auth_err_handler);
        }

        function _invite(user_data) {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('users')
                .one('invite')
                .customPOST(user_data);
        }

        function _register(user_data) {
            return Restangular
                .one('users')
                .customPOST(user_data);
        }

        function _checkActivationToken(token) {
            return Restangular
                .one('users')
                .one('activate',token)
                .get();
        }

        function _activate(token , data) {
            return Restangular
                .one('users')
                .one('activate',token)
                .customPOST(data);
        }

        function _users() {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('users')
                .get()
                .catch(_auth_err_handler);
        }

        function _roles() {
            return Restangular.one('roles').get();
        }

        // TODO move to another service ??
        function _getOrg() {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('users')
                .one('self')
                .one('organization')
                .get();
        }

        function _orgSave(data) {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('users')
                .one('self')
                .one('organization')
                .customPUT(data);
        }

        return {
            register: _register,
            login: _login,
            logout: _logout,
            isAuthenticated: _isAuthenticated,
            users: _users,
            roles: _roles,
            clients: _clients,
            invite: _invite,
            activate: _activate,
            checkActivationToken :_checkActivationToken,
            self: _self,
            getOrg: _getOrg,
            orgSave: _orgSave
        };
    });
