/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UserOrganizationFormCtrl', function ($scope, $modalInstance, greyscaleUserSrv, inform, org) {
        $scope.model = angular.copy(org);
        $scope.close = function () {
            $modalInstance.close();
        };
        $scope.update = function () {
            greyscaleUserSrv.saveOrganization($scope.model)
                .then(function (resp) {
                    org.isActive = true;
                    org.name = $scope.model.name;
                    org.address = $scope.model.address;
                    org.url = $scope.model.url;
                    $scope.close();
                })
                .catch(function (err) {
                    inform.add(err.data.message);
                });
        };
    });

