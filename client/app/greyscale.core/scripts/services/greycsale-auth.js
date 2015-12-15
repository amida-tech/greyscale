/**
 * Created by igi on 10.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .factory('greyscaleAuthSrv', function ($rootScope, $q, Restangular, $log, $cookieStore, greyscaleTokenSrv,
                                           greyscaleRestSrv, greyscaleProfileSrv, greyscaleBase64Srv) {

        var _auth_err_handler = function (err) {
            $log.debug(err);
            return $q.reject(err);
        };

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
                        greyscaleProfileSrv.logout();
                        return res;
                    });
            }
            return res;
        }

        function _logout() {
            return greyscaleRestSrv().one('users', 'logout').post()
                .catch(_auth_err_handler)
                .finally(greyscaleProfileSrv.logout);
        }

        return {
            login: _login,
            logout: _logout,
            isAuthenticated: _isAuthenticated
        };
    });
