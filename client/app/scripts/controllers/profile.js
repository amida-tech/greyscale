/**
 * Created by sbabushkin on 26.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProfileCtrl', function ($scope, greyscaleProfileSrv, greyscaleUserApi, greyscaleModalsSrv,
        greyscaleGlobals, greyscaleUtilsSrv) {

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
                title: 'E-mail',
                dataReadOnly: 'both',
                show: true
            }, {
                field: 'created',
                title: 'Created',
                dataReadOnly: 'both',
                dataFormat: 'date'
            }, {
                field: 'isActive',
                title: 'Activated',
                dataReadOnly: 'both',
                dataFormat: 'boolean'
            }, {
                field: 'lastActive',
                title: 'Last active',
                dataReadOnly: 'both',
                dataFormat: 'date'
            }, {
                field: 'firstName',
                title: 'First Name',
                show: false
            }, {
                field: 'lastName',
                title: 'Last Name',
                show: false
            }, {
                field: 'lang',
                title: 'Language',
                show: true
            }, {
                field: 'organization',
                title: 'Organization',
                dataHide: function () {
                    return (!$scope.user || $scope.user.organization === '');
                },
                dataReadOnly: 'both'
            }, {
                field: 'affiliation',
                title: 'Affilation'
            }, {
                field: 'location',
                title: 'Location',
                show: true
            }, {
                field: 'timezone',
                title: 'Timezone',
                show: false
            }, {
                field: 'cell',
                title: 'Mobile',
                show: true
            }, {
                field: 'phone',
                title: 'Phone',
                show: false
            }, {
                field: 'address',
                title: 'Address'
            }, {
                field: 'bio',
                title: 'Bio',
                dataFormat: 'textarea'
            }]
        };

        var userForm = {
            formTitle: 'profile',
            cols: $scope.view.user
        };

        greyscaleProfileSrv.getProfile()
            .then(function (user) {
                $scope.model.user = user;
                $scope.model.user.organization = '';
                $scope.model.orgReadonly = !greyscaleProfileSrv.isAdmin();
                if (!greyscaleProfileSrv.isSuperAdmin()) {
                    return greyscaleUserApi.getOrganization()
                        .then(function (resp) {
                            $scope.model.user.organization = resp.name;
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
