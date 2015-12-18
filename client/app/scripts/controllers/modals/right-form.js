/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('RightFormCtrl', function($scope, $uibModalInstance, right){
        $scope.model = {
            right: angular.copy(right)
        };

        $scope.close = function() {
            $uibModalInstance.dismiss();
        };
        $scope.save = function() {
            $uibModalInstance.close($scope.model.right);
        };
    });
