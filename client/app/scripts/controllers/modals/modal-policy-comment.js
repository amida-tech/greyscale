/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyCommentFormCtrl', function ($scope, $uibModalInstance, formData, extData) {
    $scope.model = formData;

    if (extData) {
        $scope.view = extData;
    }

    $scope.close = function () {
        $uibModalInstance.dismiss('close');
    };

    $scope.save = function () {
        $uibModalInstance.close($scope.model);
    };
});
