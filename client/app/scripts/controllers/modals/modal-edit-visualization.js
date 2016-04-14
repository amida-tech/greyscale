'use strict';

angular.module('greyscaleApp')
.controller('ModalEditVisualizationCtrl', function($scope, visualization, $uibModalInstance, $q){
    var tns = 'VISUALIZATIONS.';

    $scope.model = {
        visualization: angular.copy(visualization)
    };
    if (!$scope.model.visualization.type) {
        $scope.model.visualization.type = 'single';
    }

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        $uibModalInstance.close($scope.model.visualization);
    };
});
