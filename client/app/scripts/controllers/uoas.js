/**
 * Created by dseytlin on 29.11.15.
 *
 * @ngdoc function
 * @name greyscaleApp.controller:UoasCtrl
 * @description
 * # UoasCtrl
 * Controller (Unit of Analysis) of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp')
    .controller('UoasCtrl', function ($scope, $state) {

        var _parentState = 'uoas';

        $scope.tabs = [{
            state: 'uoasList',
            active: true,
            title: 'NAV.UOAS.LIST',
            icon: 'fa-table'
        }, {
            state: 'uoasImport',
            title: 'NAV.IMPORT',
            icon: 'fa-upload'
        }];

        $scope.go = function (state) {
            $state.go(state);
        };

        _onStateChange(function (state) {
            if (state.name === _parentState) {
                if ($scope.tabs.length > 0) {
                    $scope.go($scope.tabs[0].state);
                }
            } else {
                _setActiveTab(state);
            }
        });

        function _setActiveTab(state) {
            var activeState = state.name.replace(_parentState + '.', '');
            angular.forEach($scope.tabs, function (tab) {
                tab.active = (tab.state === activeState);
            });
        }

        function _onStateChange(handler) {
            var stateChangeDisable = $scope.$on('$stateChangeSuccess', function (e, state) {
                handler(state);
            });
            $scope.$on('$destroy', stateChangeDisable);
        }

    });
