/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleAccessSrv', function (greyscaleRestSrv, Restangular) {

        var _listRoles = function () {
            return greyscaleRestSrv().one('roles').get();
        };

        function _self() {
            return greyscaleRestSrv().one('users', 'self').get()
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

        var _listUsers = function (roleId) {
            var _param = {};
            if (roleId) {
                _param.roleID = roleId;
            }
            return greyscaleRestSrv().one('users').get(_param);
        };

        var _inviteUser = function (user_data) {
            return greyscaleRestSrv().one('users').one('invite').customPOST(user_data);
        };


        return {
            user: _self,
            roles: _listRoles,
            users: _listUsers,
            activateUser: _activate,
            registerUser: _register,
            invite: _inviteUser,
            checkActivationToken: _checkActivationToken
        };
    });
