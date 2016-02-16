'use strict';
angular.module('greyscaleApp')
.controller('ModalProductWorkflowCtrl', function (_, $scope,
    $uibModalInstance,
    product,
    greyscaleProductWorkflowTbl) {

    var productWorkflow = greyscaleProductWorkflowTbl;

    var workflowId = product.workflow ? product.workflow.id : undefined;
    productWorkflow.dataFilter.workflowId = workflowId;
    productWorkflow.expandedRowTemplateUrl = 'views/modals/product-workflow-expanded-row.html';
    productWorkflow.expandedRowShow = true;

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

    $scope.validWorkflowSteps = _validateWorkflowSteps;

    function _validateWorkflowSteps() {
        var steps = _getSteps();
        var valid = 0;
        angular.forEach(steps, function(step){
            if (step.title && step.title !== '' &&
                step.roleId &&
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
        var steps = [];
        angular.forEach(tableData, function(item){
            steps.push(_.pick(item, [
                'id', 'roleId', 'startDate', 'endDate',
                'title', 'writeToAnswers', 'sort',
                'taskAccessToDiscussions', 'taskAccessToResponses', 'taskBlindReview',
                'workflowAccessToDiscussions', 'workflowAccessToResponses', 'workflowBlindReview'
            ]));
        });
        return steps;
    }
});
