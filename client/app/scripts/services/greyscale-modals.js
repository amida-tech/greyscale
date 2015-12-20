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
                        formData: _country
                    }
                }).result;
            },
            editUoa: function (_uoa) {
                var _instance= $uibModal.open({
                    templateUrl: 'views/modals/uoa-form.html',
                    controller: 'SimpleFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        formData: _uoa
                    }
                });
                return _instance.result;
            },
            editUoaType: function (_uoaType) {
                var _instance= $uibModal.open({
                    templateUrl: 'views/modals/uoatype-form.html',
                    controller: 'SimpleFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        formData: _uoaType
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
                    controller: 'UserOrganizationFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        org: _org
                    }
                }).result;
            },
            addRoleRight: function (_role) {
                return $uibModal.open({
                    templateUrl: 'views/modals/role-right-form.html',
                    controller: 'RoleRightFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        role: _role
                    }
                }).result;
            },
            editRight: function (_right) {
                return $uibModal.open({
                    templateUrl: 'views/modals/right-form.html',
                    controller: 'SimpleFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        formData: _right
                    }
                }).result;
            }
        };
    });
