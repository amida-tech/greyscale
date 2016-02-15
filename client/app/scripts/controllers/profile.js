/**
 * Created by sbabushkin on 26.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProfileCtrl', function ($scope, greyscaleProfileSrv, greyscaleUserApi, greyscaleModalsSrv,
        greyscaleGlobals, greyscaleUtilsSrv, greyscaleUsersTbl, $log) {

        $scope.org = {
            loaded: false,
            name: '',
            address: '',
            url: ''
        };

        var _user = greyscaleUsersTbl;

        var _cols = angular.copy(_user.cols);

        var _hide = ['id', 'organizationId', 'roleID', 'isAnonym'];
        var userForm = {
            formTitle: 'profile',
            cols: _cols
        };

        $log.debug(_user, _cols.length);
        for (var c = 0; c < _cols.length; c++) {
            if (_hide.indexOf(userForm.cols[c].field) !== -1) {
                $log.debug('hide');
                userForm.cols.splice(c, 1);
            }
//            userForm.cols[c].dataHide = (_hide.indexOf(userForm.cols[c]) !== -1);
        }

        greyscaleProfileSrv.getProfile()
            .then(function (user) {
                $scope.model = user;
                $scope.user = user;
                if (greyscaleProfileSrv.isAdmin()) {
                    return greyscaleUserApi.getOrganization()
                        .then(function (resp) {
                            $scope.org = resp;
                            $scope.org.loaded = true;
                        });
                }
            })
            .catch(greyscaleUtilsSrv.errorMsg);

        $scope.editProfile = function () {
            greyscaleModalsSrv.editRec($scope.user, userForm)
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
