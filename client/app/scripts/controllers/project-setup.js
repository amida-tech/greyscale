/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupCtrl', function ($q, $scope, $state, $log) {

        var _parentState = 'projects.setup';

        $scope.tabs = [{
            state: 'surveys',
            title: 'NAV.PROJECTS.SURVEYS',
            icon: 'fa-list'
        }, {
            state: 'products',
            title: 'NAV.PROJECTS.PRODUCTS',
            icon: 'fa-briefcase'
        }];

        $scope.go = function (state, params, options) {
            $state.go(_parentState + '.' + state, params || {}, options || {});
        };

        _onStateChange(function (state) {
            if (state.name === _parentState) {
                $scope.go(_getDefaultState(), {}, {
                    location: 'replace'
                });
            } else {
                _setActiveTab(state);
            }
        });

        function _getDefaultState() {
            return 'products';
        }

        function _setActiveTab(state) {
            var activeState = state.name.replace(_parentState + '.', '');

            angular.forEach($scope.tabs, function (tab, index) {
                if (tab.state === activeState) {
                    tab.active = index;
                }
            });
        }

        function _onStateChange(handler) {
            var stateChangeDisable = $scope.$on('$stateChangeSuccess', function (e, state) {
                handler(state);
            });
            $scope.$on('$destroy', stateChangeDisable);
        }

    });
