/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('SimpleFormCtrl', function ($scope, $uibModalInstance, formData, extData) {
        $scope.model = angular.copy(formData);

        if (extData) {
            $scope.view = angular.copy(extData);
        }

        $scope.close = function () {
            $uibModalInstance.dismiss('close');
        };

        $scope.save = function () {
            $uibModalInstance.close($scope.model);
        };
    });
