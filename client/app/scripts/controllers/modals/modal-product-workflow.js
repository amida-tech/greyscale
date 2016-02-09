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

    $scope.validWorkflowSteps = function(){
        var selected = productWorkflow.multiselect.selectedMap;
        if (!selected.length) {
            return false;
        } else {
            return _validateWorkflowSteps();
        }
    };

    function _validateWorkflowSteps() {
        var steps = _getSteps();
        var valid = 0;
        angular.forEach(steps, function(step){
            if (step.roleId &&
                step.startDate &&
                step.endDate &&
                step.writeToAnswers !== undefined
            ) {
                valid++;
            }
        });
        return valid == steps.length;
    }

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
