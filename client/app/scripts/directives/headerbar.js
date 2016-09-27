/**
 * Created by igi on 09.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('headerbar', function () {
        return {
            templateUrl: 'views/directives/headerbar.html',
            scope: {},
            restrict: 'E',
            replace: true,
            controller: function ($scope, $state, greyscaleProfileSrv) {

                $scope.stateExt = $state.ext;

                $scope.$on('$stateChangeSuccess', _initBreadcrumbs);

                _initBreadcrumbs();

                function _initBreadcrumbs() {
                    greyscaleProfileSrv.getAccessLevel().then(function (level) {
                        $scope.model = {
                            title: $state.current.data.name,
                            path: _getPath($state.$current.parent, level)
                        };
                    });
                }

                function _getPath(_state, level) {
                    var path = [];
                    while (_state) {
                        if (_state.data && _state.data.name) {
                            path.unshift({
                                route: _state.name,
                                name: _state.data.name,
                                hasAccess: !!(level & _state.data.accessLevel)
                            });
                        }
                        _state = _state.parent;
                    }
                    return path;
                }
            }
        };
    });
