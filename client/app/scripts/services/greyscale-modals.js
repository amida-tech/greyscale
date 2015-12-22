/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .service('greyscaleModalsSrv', function ($uibModal) {
        return {
            editCountry: function (_country) {
                return $uibModal.open({
                    templateUrl: 'views/modals/country-form.html',
                    controller: 'SimpleFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        formData: _country,
                        extData: null
                    }
                }).result;
            },
            editUoa: function (_uoa) {
                var _instance = $uibModal.open({
                    templateUrl: 'views/modals/uoa-form.html',
                    controller: 'SimpleFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        formData: _uoa,
                        extData: null
                    }
                });
                return _instance.result;
            },
            editUoaType: function (_uoaType, _languages) {
                var _instance = $uibModal.open({
                    templateUrl: 'views/modals/uoatype-form.html',
                    controller: 'SimpleFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        formData: _uoaType,
                        extData: _languages
                    }
                });
                return _instance.result;
            },
            inviteUser: function () {
                return $uibModal.open({
                    templateUrl: 'views/modals/user-invite.html',
                    controller: 'UserInviteCtrl',
                    size: 'md',
                    windowClass: 'modal fade in'
                }).result;
            },
            editUserOrganization: function (_org) {
                return $uibModal.open({
                    templateUrl: 'views/modals/user-organization-form.html',
                    controller: 'SimpleFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        formData: _org,
                        extData: null
                    }
                }).result;
            },
            addRoleRight: function (_role, _ext) {
                return $uibModal.open({
                    templateUrl: 'views/modals/role-right-form.html',
                    controller: 'SimpleFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        formData: _role,
                        extData: _ext
                    }
                }).result;
            },
            editRight: function (_right, _ext) {
                return $uibModal.open({
                    templateUrl: 'views/modals/right-form.html',
                    controller: 'SimpleFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        formData: _right,
                        extData: _ext
                    }
                }).result;
            }
        };
    });
