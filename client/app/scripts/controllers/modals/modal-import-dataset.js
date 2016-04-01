'use strict';

angular.module('greyscaleApp')
.controller('ModalImportDatasetCtrl', function($scope, $uibModalInstance, $q, dataset, visualizationId, Organization) {
    $scope.model = {
        dataset: angular.copy(dataset),
        visualizationId: angular.copy(visualizationId),
        editing: false
    };
    if ($scope.model.dataset.id) {
        $scope.model.editing = true;
    }

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
