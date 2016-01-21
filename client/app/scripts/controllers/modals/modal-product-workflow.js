'use strict';
angular.module('greyscaleApp')
.controller('ModalProductWorkflowCtrl', function ($scope,
                                              $uibModalInstance,
                                              product,
                                              greyscaleProductWorkflowTbl,
                                              greyscaleProductApi) {

    $scope.product = angular.copy(product);


    var productWorkflow = greyscaleProductWorkflowTbl;
    productWorkflow.dataFilter.productId = $scope.product.id;

    $scope.model = {
        productWorkflow: productWorkflow
    };



    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        var newSteps = $scope.model.productWorkflow.multiselect.selectedMap;
        greyscaleProductApi.product(product.id).workflowUpdate(newSteps)
            .then(function(){
                $uibModalInstance.close($scope.model);
            });
    };

});
