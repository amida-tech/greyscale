'use strict';
angular.module('greyscaleApp')
.controller('ModalProductWorkflowCtrl', function (_, $scope,
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

    $scope.validWorkflowSteps = _validateWorkflowSteps;

    function _validateWorkflowSteps() {
        var steps = _getSteps();
        var valid = 0;
        angular.forEach(steps, function(step){
            if (step.title && step.title !== '' &&
                step.role &&
                step.startDate &&
                step.endDate &&
                step.groups && step.groups.length
            ) {
                valid++;
            }
        });
        return valid !== 0 && valid == steps.length;
    }

    function _getSteps() {
        var tableData = productWorkflow.tableParams.data;
        var steps = [];
        angular.forEach(tableData, function(item, i){
            var step = _.pick(item, [
                'id', 'role', 'startDate', 'endDate',
                'title', 'writeToAnswers', 'groups',
                'discussionParticipation', 'provideResponses', 'seeOthersResponses',
                'editTranslate', 'blindReview'
            ]);
            step.groups = _.map(step.groups, 'id');
            step.position = i;
            steps.push(step);
        });
        return steps;
    }
});
