/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyCommentFormCtrl', function ($scope, $uibModalInstance, formData, extData) {
    $scope.model = formData;
	$scope.tagDisabled = false;

    if (extData) {
        $scope.view = angular.copy(extData);
    }

    $scope.close = function () {
        $uibModalInstance.dismiss('close');
    };

    $scope.save = function () {
        $uibModalInstance.close($scope.model);
    };
	
	$scope.onFlagChange = function () {
            if ($scope.model.flag) {
                var author = _.find($scope.model.tags, { userId: $scope.model.policyAuthor });
                $scope.model.tag = author ? [author] : [];
                $scope.tagDisabled = true;
            } else {
                $scope.tagDisabled = false;
            }
        };
});
