/**
 * Created by igi on 08.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('DashboardCtrl', function ($scope, $rootScope, $state, greyscaleSideMenu, greyscaleProfileSrv) {

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
        greyscaleProfileSrv.getProfile().then(function (profile) {
            var _level = greyscaleProfileSrv.getAccessLevelMask();
            var _groups = [];

            $scope.model.user = profile;
            for (var g = 0; g < greyscaleSideMenu.groups.length; g++) {
                var _items = [];
                var _group = greyscaleSideMenu.groups[g];
                for (var i = 0; i < _group.states.length; i++) {
                    var _state = $state.get(_group.states[i]);
                    var _accessLevel = (_state.data.accessLevel & _level);
                    if (_state.data && _state.data.accessLevel && _accessLevel !== 0) {
                        _items.push({
                            sref: _state.name,
                            title: _state.data.name,
                            icon: _state.data.icon
                        });
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
        });
        $scope.logout = function () {
            $rootScope.$emit('logout');
        };
    });
