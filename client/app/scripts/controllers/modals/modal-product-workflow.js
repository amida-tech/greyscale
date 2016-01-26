'use strict';
angular.module('greyscaleApp')
.controller('ModalProductWorkflowCtrl', function ($scope,
    $uibModalInstance,
    product,
    greyscaleProductWorkflowTbl) {

    var productWorkflow = greyscaleProductWorkflowTbl;

    var workflowId = product.workflow ? product.workflow.id : undefined;
    productWorkflow.dataFilter.workflowId = workflowId;

    $scope.model = {
        product: angular.copy(product),
        productWorkflow: productWorkflow
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        var steps = _getSteps();
        var resolveData = {
            workflow: $scope.model.product.workflow,
            steps: steps
        };
        resolveData.workflow.productId = product.id;
        $uibModalInstance.close(resolveData);
    };

    function _getSteps() {
        var tableData = productWorkflow.tableParams.data;
        var selected = productWorkflow.multiselect.selected;
        var steps = [];
        angular.forEach(tableData, function(item){
            if (selected[item.id] && item.step) {
                steps.push(item.step);
            }
        });
        return steps;
    }
});
