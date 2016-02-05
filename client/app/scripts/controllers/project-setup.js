/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupCtrl', function ($q, $scope, $state, $stateParams, inform,
        greyscaleProjectApi) {

        var _parentState = 'projects.setup';

        $scope.tabs = [{
            state: 'roles',
            title: 'NAV.PROJECTS.USER_ROLES',
            icon: 'fa-users'
        }, {
            state: 'surveys',
            title: 'NAV.PROJECTS.SURVEYS',
            icon: 'fa-list'
        }, {
            state: 'products',
            title: 'NAV.PROJECTS.PRODUCTS',
            icon: 'fa-briefcase'
        }];

        $scope.go = function (state, params, options) {
            $state.go(_parentState + '.' + state, params||{}, options||{});
        };

        greyscaleProjectApi.get($stateParams.projectId)
            .then(function (project) {
                $state.ext.projectName = project.codeName;
                $scope.project = project;
            }, function () {
                inform.add('Project Not Found', {
                    type: 'danger'
                });
                $state.go('home');
            });

        _onStateChange(function (state) {
            if (state.name === _parentState) {
                $scope.go(_getDefaultState(), {}, {location: 'replace'});
            } else {
                _setActiveTab(state);
            }
        });

        function _getDefaultState() {
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
