/**
 * Created by igi on 08.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('DashboardCtrl', function ($scope, $rootScope, $state, greyscaleSideMenu, greyscaleProfileSrv,
        greyscaleGlobals, i18n, Organization) {

        var _level;

        $scope.model = {
            menu: {
                title: greyscaleSideMenu.title,
                groups: []
            },
            user: {
                firstName: 'John',
                lastName: 'Doe'
            },
            messages: [],
            toggle: false
        };

        Organization.$watch($scope, function () {
            greyscaleProfileSrv.getProfile().then(function (profile) {
                _level = greyscaleProfileSrv.getAccessLevelMask();
                var _groups = [];

                $scope.model.user = profile;
                for (var g = 0; g < greyscaleSideMenu.groups.length; g++) {
                    var _items = [];
                    var _group = greyscaleSideMenu.groups[g];
                    for (var i = 0; i < _group.states.length; i++) {
                        var _state = $state.get(_group.states[i]);
                        if (_state) {
                            var _accessLevel = (_state.data.accessLevel & _level);
                            var customAccess = _getCustomAccess(_state.data.customAccess);
                            if (_state.data && _state.data.accessLevel && _accessLevel !== 0 && customAccess) {
                                _items.push({
                                    sref: _state.name,
                                    title: _state.data.name,
                                    icon: _state.data.icon
                                });
                            }
                        }
                    }
                    if (_items.length > 0) {
                        _groups.push({
                            title: _group.title,
                            items: _items
                        });
                    }
                }
                $scope.model.menu.groups = _groups;

                var roleName = 'ROLE_USER';
                if (_isAdmin()) {
                    roleName = 'ROLE_ADMIN';
                } else if (_isSuperAdmin()) {
                    roleName = 'ROLE_SUPERADMIN';
                }
                $scope.model.user.roleName = i18n.translate('DASHBOARD.' + roleName);
            });
        });

        $scope.logout = function () {
            $rootScope.$emit(greyscaleGlobals.events.common.logout);
        };

        function _isSuperAdmin() {
            return (_level & greyscaleGlobals.userRoles.superAdmin.mask) === greyscaleGlobals.userRoles.superAdmin.mask;
        }

        function _isAdmin() {
            return (_level & greyscaleGlobals.userRoles.admin.mask) === greyscaleGlobals.userRoles.admin.mask;
        }

        function _getCustomAccess(customAccess) {
            var access = true;
            customAccess = customAccess || {};
            if (customAccess.enableFeaturePolicy !== undefined) {
                access = Organization.enableFeaturePolicy === customAccess.enableFeaturePolicy;
            }
            return access;
        }
    });
