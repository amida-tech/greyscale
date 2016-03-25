'use strict';

angular.module('greyscaleApp')
.controller('ModalImportDatasetCtrl', function($scope, $uibModalInstance, $q, visualizationId, Organization) {
    $scope.model = {
        dataset: {},
        visualizationId: angular.copy(visualizationId)
    };

    Organization.$watch($scope, function () {
        $scope.model.organizationId = Organization.id;
    });

    $scope.afterUpload = function (file, data) {
        $scope.model.dataset.cols = data.cols;
        $scope.model.dataset.data = data.data;
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        $uibModalInstance.close($scope.model.dataset);
    };
});
