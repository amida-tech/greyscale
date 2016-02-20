/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersCtrl', function ($scope, $state, greyscaleProfileSrv) {
        var _parentState = 'users';

        var _states = ['List', 'Groups', 'Uoa', 'Import'];
        $scope.tabs = [];

        greyscaleProfileSrv.getProfile().then(function (profile) {
            var _level = greyscaleProfileSrv.getAccessLevelMask();
            for (var s = 0; s < _states.length; s++) {

                var _state = $state.get(_parentState + _states[s]);
                var _accessLevel = (_state.data.accessLevel & _level);
                if (_state.data && _state.data.accessLevel && _accessLevel !== 0) {
                    $scope.tabs.push({
                        state: _states[s],
                        title: _state.data.name,
                        icon: _state.data.icon
                    });
                }
            }

            _resolveState($state.current);

        });

        _onStateChange(_resolveState);

        $scope.go = function (state) {
            $state.go(_parentState + state);
        };

        function _resolveState(state) {
            if (state.name === _parentState) {
                if ($scope.tabs.length > 0) {
                    $scope.go($scope.tabs[0].state);
                }
            } else {
                _setActiveTab(state);
            }
        }

        function _setActiveTab(state) {
            var activeState = state.name.replace(_parentState, '');
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
