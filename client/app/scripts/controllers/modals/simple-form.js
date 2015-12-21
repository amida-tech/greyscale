/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('SimpleFormCtrl', function ($scope, $uibModalInstance, formData) {
        $scope.model = angular.copy(formData);

        $scope.close = function () {
            $uibModalInstance.dismiss();
        };

        $scope.save = function () {
            $uibModalInstance.close($scope.model);
        };
    });
