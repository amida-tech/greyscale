/**
 * Created by igi on 09.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('headerbar', function () {
        return {
            template: '<div class="meta"><div class="page">{{model.title}}</div><div class="breadcrumb-links">' +
                '<ul class="breadcrumb"><li ng-repeat="parent in model.path">' +
                '<a ui-sref="{{parent.route}}">{{parent.name}}</a></li><li class="active">{{model.title}}</li>' +
                '</ul></div></div>',
            scope: {},
            restrict: 'AE',
            controller: function ($scope, $state) {
                var _getPath = function (_state) {
                    var path = [];
                    while (_state) {
                        if (_state.data && _state.data.name) {
                            path.unshift({
                                route: _state.name,
                                name: _state.data.name
                            });
                        }
                        _state = _state.parent;
                    }

                    return path;
                };

                $scope.$on('$stateChangeSuccess', function () {
                    $scope.model = {
                        title: $state.current.data.name,
                        path: _getPath($state.$current.parent)
                    };
                });
            }
        };
    });
