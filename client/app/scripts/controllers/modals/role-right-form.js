/**
 * Created by igi on 17.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('RoleRightFormCtrl', function ($scope, $uibModalInstance, greyscaleRightSrv,
                                               inform, role) {
        $scope.model = angular.copy(role);
        $scope.view = {};
        greyscaleRightSrv.list().then(function (rights) {
            $scope.view.rights = rights;
        });

        $scope.close = function () {
            $uibModalInstance.dismiss(false);
        };

        $scope.update = function () {
            $uibModalInstance.close($scope.selected.id)
        };
    });

