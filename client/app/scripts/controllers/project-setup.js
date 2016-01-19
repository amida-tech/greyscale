/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupCtrl', function ($scope, $state, $stateParams, inform,
        greyscaleProjectApi, greyscaleUsersTbl, greyscaleEntityRolesTbl) {

        var entityRoles = greyscaleEntityRolesTbl;

        $scope.model = {
            project: null,
            users: greyscaleUsersTbl,
            entRoles: entityRoles
        };

        greyscaleProjectApi.get($stateParams.projectId)
            .then(function (data) {
                $scope.model.project = data;

                _initUserRolesTab();

            }, function () {
                inform.add('Project Not Found', {
                    type: 'danger'
                });
                $state.go('home');
            });

        function _initUserRolesTab() {
            entityRoles.dataFilter.entityId = $scope.model.project.id;
            entityRoles.tableParams.reload();
        }

    });
