/**
 * Created by sbabushkin on 26.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProfileCtrl', function ($scope, greyscaleProfileSrv, greyscaleUserSrv, inform, greyscaleModalsSrv) {

        $scope.org = {
            loaded: false,
            name: '',
            address: '',
            url: ''
        };

        greyscaleProfileSrv.getProfile()
            .then(function (user) {
                $scope.user = user;
                if (user.roleID === 2) {
                    greyscaleUserSrv.getOrganization()
                        .then(function (resp) {
                            $scope.org = resp;
                            $scope.org.loaded = true;
                        })
                        .catch(function (err) {
                            inform.add(err.data.message, {
                                type: 'danger'
                            });
                        });
                }
            })
            .catch(function (err) {
                inform.add(err.data.message, {
                    type: 'danger'
                });
            });

        $scope.editProfile = function () {
            inform.add('editProfile', {
                type: 'success'
            });
        };

        $scope.editOrg = function () {
            greyscaleModalsSrv.editUserOrganization($scope.org)
                .then(function (_org) {
                    if (typeof _org.isActive === 'undefined') {
                        _org.isActive = true;
                    }
                    return greyscaleUserSrv.saveOrganization(_org)
                        .then(function (resp) {
                            $scope.org = _org;
                            return resp;
                        });
                })
                .catch(function (err) {
                    if (err && err.data) {
                        inform.add(err.data.message);
                    }
                });
        };
    });
