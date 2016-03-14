'use strict';

angular.module('greyscaleApp')
.controller('ModalEditVisualizationCtrl', function($scope, visualization, $uibModalInstance, $q){
    var tns = 'VISUALIZATIONS.';

    $scope.model = {
        visualization: angular.copy(visualization)
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        $uibModalInstance.close($scope.model.visualization);
    };
});
