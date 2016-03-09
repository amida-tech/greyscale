/**
 * Created by sbabushkin on 26.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProfileCtrl', function ($scope, greyscaleProfileSrv, greyscaleUserApi, greyscaleModalsSrv,
        greyscaleGlobals, greyscaleUtilsSrv) {

        var tns = 'PROFILE.';

        $scope.model = {
            org: {
                loaded: false,
                name: '',
                address: '',
                url: ''
            },
            orgReadonly: true,
            user: {}
        };

        $scope.view = {
            user: [{
                field: 'email',
                title: tns + 'EMAIL',
                dataReadOnly: 'both',
                show: true
            }, {
                field: 'created',
                title: tns + 'CREATED',
                dataReadOnly: 'both',
                dataFormat: 'date'
            }, {
                field: 'isActive',
                title: tns + 'ACTIVATED',
                dataReadOnly: 'both',
                dataFormat: 'boolean'
            }, {
                field: 'lastActive',
                title: tns + 'LAST_ACTIVE',
                dataReadOnly: 'both',
                dataFormat: 'date'
            }, {
                field: 'firstName',
                title: tns + 'FIRST_NAME',
                show: false
            }, {
                field: 'lastName',
                title: tns + 'LAST_NAME',
                show: false
            }, {
                field: 'lang',
                title: tns + 'LANGUAGE',
                show: true
            }, {
                field: 'organization',
                title: tns + 'ORGANIZATION',
                dataHide: function () {
                    return (!$scope.user || $scope.user.organization === '');
                },
                dataReadOnly: 'both'
            }, {
                field: 'affiliation',
                title: tns + 'AFFILATION'
            }, {
                field: 'location',
                title: tns + 'LOCATION',
                show: true
            }, {
                field: 'timezone',
                title: tns + 'TIMEZONE',
                show: false
            }, {
                field: 'cell',
                title: tns + 'MOBILE',
                show: true
            }, {
                field: 'phone',
                title: tns + 'PHONE',
                show: false
            }, {
                field: 'address',
                title: tns + 'ADDRESS'
            }, {
                field: 'bio',
                title: tns + 'BIO',
                dataFormat: 'textarea'
            }]
        };

        var userForm = {
            formTitle: tns + 'PROFILE',
            cols: $scope.view.user
        };

        greyscaleProfileSrv.getProfile()
            .then(function (user) {
                $scope.model.user = user;
                $scope.model.orgReadonly = !greyscaleProfileSrv.isAdmin();
                if (!greyscaleProfileSrv.isSuperAdmin()) {
                    return greyscaleUserApi.getOrganization()
                        .then(function (resp) {
                            $scope.model.org = resp;
                            $scope.model.org.loaded = true;
                        });
                }
            })
            .catch(greyscaleUtilsSrv.errorMsg);

        $scope.editProfile = function () {
            var _userData = angular.copy($scope.model.user);
            greyscaleModalsSrv.editRec(_userData, userForm)
                .then(function (_user) {
                    delete _user.organization;
                    return greyscaleUserApi.save(_user)
                        .then(function (resp) {
                            $scope.model.user = _user;
                            $scope.model.user.organization = $scope.model.org.name;
                            return resp;
                        });
                })
                .catch(greyscaleUtilsSrv.errorMsg);
        };

        $scope.editOrg = function () {
            greyscaleModalsSrv.editUserOrganization($scope.model.org)
                .then(function (_org) {
                    if (typeof _org.isActive === 'undefined') {
                        _org.isActive = true;
                    }
                    return greyscaleUserApi.saveOrganization(_org)
                        .then(function (resp) {
                            $scope.model.org = _org;
                            $scope.model.user.organization = _org.name;
                            return resp;
                        });
                })
                .catch(greyscaleUtilsSrv.errorMsg);
        };
    });
