/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyCommentFormCtrl', function ($scope, $uibModalInstance, greyscaleProfileSrv, formData, extData) {
    $scope.model = formData;
	$scope.tagDisabled = false;

    if (extData) {
        $scope.view = extData;
    }

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        $uibModalInstance.close($scope.model);
    };

    $scope.isAdmin = greyscaleProfileSrv.isAdmin();

    $scope.tagFilter = {};

	$scope.onFlagChange = function () {
        if ($scope.model.flag) {
            var author = _.find($scope.model.tags, { userId: $scope.model.policyAuthor });
            $scope.model.tag = author ? [author] : [];
            $scope.tagDisabled = true;

        } else {
	        $scope.tagDisabled = false;
            $scope.tagFilter = {};
        }

        $scope.tagFilter = $scope.model.isReturn ? {isAdmin: true} : {};
    };
});
