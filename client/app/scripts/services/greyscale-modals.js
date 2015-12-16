/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .service('greyscaleModalsSrv', function ($uibModal) {
        return {
            editCountry: function (formData) {
                var _instance= $uibModal.open({
                    templateUrl: 'views/modals/country-form.html',
                    controller: 'CountryFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        data: formData
                    }
                });
                return _instance.result;
            },
            inviteUser: function () {
                $uibModal.open({
                    templateUrl: "views/modals/user-invite.html",
                    controller: 'UserInviteCtrl',
                    size: 'md',
                    windowClass: 'modal fade in'
                });
            },
            editUserOrganization: function (_org) {
                $uibModal.open({
                    templateUrl: "views/modals/user-organization-form.html",
                    controller: 'UserOrganizationFormCtrl',
                    size: 'md',
                    windowClass: 'modal fade in',
                    resolve: {
                        org: _org
                    }
                });
            }
        };
    });
