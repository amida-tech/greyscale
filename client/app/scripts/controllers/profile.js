/**
 * Created by sbabushkin on 26.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProfileCtrl', function ($scope, greyscaleProfileSrv, greyscaleUserApi, greyscaleModalsSrv,
        greyscaleGlobals, greyscaleUtilsSrv) {

        $scope.org = {
            loaded: false,
            name: '',
            address: '',
            url: ''
        };

        greyscaleProfileSrv.getProfile()
            .then(function (user) {
                $scope.user = user;
                if (user.roleID === greyscaleGlobals.userRoles.admin.id) {
                    return greyscaleUserApi.getOrganization()
                        .then(function (resp) {
                            $scope.org = resp;
                            $scope.org.loaded = true;
                        });
                }
            })
            .catch(greyscaleUtilsSrv.errorMsg);

        $scope.editProfile = function () {
            greyscaleModalsSrv.editUserProfile($scope.user)
                .then(function (_user) {
                    return greyscaleUserApi.save(_user)
                        .then(function (resp) {
                            $scope.user = _user;
                            return resp;
                        });
                })
                .catch(greyscaleUtilsSrv.errorMsg);
        };

        $scope.editOrg = function () {
            greyscaleModalsSrv.editUserOrganization($scope.org)
                .then(function (_org) {
                    if (typeof _org.isActive === 'undefined') {
                        _org.isActive = true;
                    }
                    return greyscaleUserApi.saveOrganization(_org)
                        .then(function (resp) {
                            $scope.org = _org;
                            return resp;
                        });
                })
                .catch(greyscaleUtilsSrv.errorMsg);
        };
    });
