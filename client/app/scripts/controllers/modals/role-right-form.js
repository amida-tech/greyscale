/**
 * Created by igi on 17.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('RoleRightFormCtrl', function ($scope, $uibModalInstance, greyscaleRoleSrv, greyscaleAccessSrv,
                                               inform, $log, role) {
        $scope.model = angular.copy(role);
        $scope.view = {};
        $log.debug('role', role);
        greyscaleAccessSrv.rights().then(function (rights) {
            $scope.view.rights = rights;
        });

        $scope.close = function () {
            $uibModalInstance.close(false);
        };

        $scope.update = function () {
            return greyscaleRoleSrv.addRight(role.id, $scope.selected.id)
                .then(function(resp){
                    $uibModalInstance.close(true);
                })
                .catch(function (err) {
                    if (err.data) {
                        inform.add(err.data.message);
                    }
                    $uibModalInstance.close(false);
                });
        };
    });

