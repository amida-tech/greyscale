/**
 * Created by igi on 09.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('headerbar', function () {
        return {
            template: '<div class="meta"><div class="page">{{model.title|translate:{ext:stateExt} }}</div><div class="breadcrumb-links">' +
                '<ul class="breadcrumb"><li ng-repeat="parent in model.path">' +
                '<a ui-sref="{{parent.route}}">{{parent.name|translate:{ext:stateExt} }}</a></li><li class="active">{{model.title|translate:{ext:stateExt} }}</li>' +
                '</ul></div></div>',
            scope: {},
            restrict: 'E',
            replace: true,
            controller: function ($scope, $state) {

                $scope.stateExt = $state.ext;

                $scope.$on('$stateChangeSuccess', function () {
                    $scope.model = {
                        title: $state.current.data.name,
                        path: _getPath($state.$current.parent)
                    };
                });

                function _getPath(_state) {
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
                }
            }
        };
    });
