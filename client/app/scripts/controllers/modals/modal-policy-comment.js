/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyCommentFormCtrl', function ($scope, $uibModalInstance, formData, extData) {
    $scope.model = angular.copy(formData);
    
    
    $scope.$on('modal.closing', function (event, reason, closed) {
        if (!reason || !reason.model) {
            event.preventDefault();
            $uibModalInstance.dismiss({ reason: reason, model: $scope.model });
        }
    });
    
    if (extData) {
        $scope.view = angular.copy(extData);
    }
    
    $scope.close = function () {
        $uibModalInstance.dismiss();
    };
    
    $scope.save = function () {
        $uibModalInstance.close($scope.model);
    };
});
