/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .factory('greyscaleModalsSrv', function ($uibModal) {
        var _simpleForm = function (tmplUrl, data, ext) {
            return $uibModal.open({
                templateUrl: tmplUrl,
                controller: 'SimpleFormCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    formData: data,
                    extData: ext
                }
            }).result;
        };

        return {
            editCountry: function (_country) {
                return _simpleForm('views/modals/country-form.html', _country, null);
            },
            editUoa: function (_uoa, extData) {
                return _simpleForm('views/modals/uoa-form.html', _uoa, extData);
            },
            editUoaType: function (_uoaType, _languages) {
                return _simpleForm('views/modals/uoatype-form.html', _uoaType, _languages);
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
                return _simpleForm('views/modals/user-organization-form.html', _org, null);
            },
            addRoleRight: function (_role, _ext) {
                return _simpleForm('views/modals/role-right-form.html', _role, _ext);
            },
            editRight: function (_right, _ext) {
                return _simpleForm('views/modals/role-right-form.html', _right, _ext);
            },
            editProject: function (prj, data) {
                return _simpleForm('views/modals/project-form.html', prj, data);
            }
        };
    });
