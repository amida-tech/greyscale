/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupCtrl', function ($q, $scope, $state, $stateParams, inform,
        greyscaleProjectApi) {

        var _parentState = 'projects.setup';
        var _defaultState = false;

        $scope.tabs = [{
            state: 'roles',
            title: 'User Roles',
            icon: 'fa-users'
        }, {
            state: 'surveys',
            title: 'Surveys',
            icon: 'fa-list'
        }, {
            state: 'products',
            title: 'Products',
            icon: 'fa-briefcase'
        }, {
            state: 'tasks',
            title: 'Tasks',
            icon: 'fa-tasks'
        }];

        $scope.go = function (state) {
            $state.go(_parentState + '.' + state);
        };

        greyscaleProjectApi.get($stateParams.projectId)
            .then(function (project) {
                $scope.project = project;
                if (_defaultState) {
                    $scope.go(_getDefaultState(project));
                }
            }, function () {
                inform.add('Project Not Found', {
                    type: 'danger'
                });
                $state.go('home');
            });

        _onStateChange(function (state) {
            if (state.name === _parentState) {
                _defaultState = true;
            } else {
                _setActiveTab(state);
            }
        });

        function _getDefaultState(project) {
            return 'products';
        }

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
