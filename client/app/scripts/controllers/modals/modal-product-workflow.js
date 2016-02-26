'use strict';
angular.module('greyscaleApp')
.controller('ModalProductWorkflowCtrl', function (_, $scope,
    $uibModalInstance,
    product, OrganizationSelector,
    greyscaleProductWorkflowTbl) {

    var productWorkflow = greyscaleProductWorkflowTbl;

    var workflowId = product.workflow ? product.workflow.id : undefined;
    productWorkflow.dataFilter.workflowId = workflowId;
    productWorkflow.dataFilter.organizationId = OrganizationSelector.organization.id;


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
                step.usergroupId && step.usergroupId.length
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
                'title', 'writeToAnswers',
                'discussionParticipation', 'provideResponses', 'seeOthersResponses',
                'allowEdit', 'allowTranslate', 'blindReview'
            ]);
            step.usergroupId = _.map(item.groups, 'id');
            step.position = i;
            steps.push(step);
        });
        return steps;
    }
});
