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
            toggle: false
        };

        greyscaleProfileSrv.getAccessLevel()
            .then(function (_level) {
                var _groups = [];
                for (var g = 0; g < greyscaleSideMenu.groups.length; g++) {
                    var _items = [];
                    var _group = greyscaleSideMenu.groups[g];
                    for (var i = 0; i < _group.items.length; i++) {
                        var _state = $state.get(_group.items[i].state);
                        var _accessLevel = _state.data.accessLevel & _level;
                        if (_state.data && _state.data.accessLevel && _accessLevel !== 0) {
                            _items.push({
                                sref: _state.name,
                                title: _state.data.name,
                                icon: _group.items[i].icon
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
