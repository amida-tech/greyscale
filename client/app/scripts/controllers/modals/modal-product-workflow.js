'use strict';
angular.module('greyscaleApp')
.controller('ModalProductWorkflowCtrl', function (_, $scope,
    $uibModalInstance,
    product, modalParams, Organization,
    greyscaleProductWorkflowTbl,
    greyscaleWorkflowTemplateApi,
    greyscaleUtilsSrv) {

    var productWorkflow = greyscaleProductWorkflowTbl;

    var workflowId = product.workflow ? product.workflow.id : undefined;
    productWorkflow.dataFilter.workflowId = workflowId;
    productWorkflow.dataFilter.organizationId = Organization.id;
    productWorkflow.dataFilter.product = product;

    $scope.modalParams = angular.copy(modalParams);
    $scope.model = {
        product: angular.copy(product),
        productWorkflow: productWorkflow
    };

    var workflowTemplateMode = $scope.workflowTemplateMode = !product.projectId;

    if (!workflowTemplateMode) {
        _refreshTemplatesList();
    } else {
        productWorkflow.dataFilter.workflowTemplateMode = true;
    }

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        var steps = _getSteps();
        var resolveData = {
            workflow: $scope.model.product.workflow || {},
            steps: steps
        };
        if (workflowTemplateMode) {
            resolveData.id = product.id;
        } else {
            resolveData.workflow.productId = product.id;
        }
        $uibModalInstance.close(resolveData);
    };

    $scope.validWorkflowSteps = _validateWorkflowSteps;

    $scope.applyWorkflowTemplate = _applyWorkflowTemplate;

    $scope.saveAsTemplate = _saveCurrentWorkflowAsTemplate;

    function _validateWorkflowSteps() {
        var steps = _getSteps();
        var valid = 0;
        angular.forEach(steps, function(step){
            if (step.title && step.title !== '' &&
                step.role && step.role !== '' &&
                (workflowTemplateMode || (step.startDate && step.endDate)) &&
                step.usergroupId && step.usergroupId.length
            ) {
                valid++;
            }
        });
        return valid !== 0 && valid == steps.length;
    }

    var permissionFields = ['provideResponses', 'allowEdit', 'allowTranslate'];

    function _getSteps() {
        var tableData = productWorkflow.tableParams.data;
        var steps = [];
        angular.forEach(tableData, function(item, i){
            var step = _.pick(item, [
                'id', 'role', 'startDate', 'endDate',
                'title',
                'discussionParticipation', 'seeOthersResponses',
                'blindReview'
            ]);
            step.usergroupId = _.map(item.groups, 'id');
            step.position = i;
            if (item.surveyAccess === 'noWriteToAnswers') {
                step.writeToAnswers = false;
            } else if (item.surveyAccess === 'writeToAnswers') {
                step.writeToAnswers = true;
            } else {
                step.writeToAnswers = null;
            }
            angular.forEach(permissionFields, function(perm){
               step[perm] = item.surveyAccess === perm;
            });
            steps.push(step);

        });
        return steps;
    }

    function _getGroup(id) {
        return _.find(productWorkflow._dicts.groups, {id: id});
    }

    function _setSteps(steps) {
        productWorkflow.tableParams.data.splice(0);
        angular.forEach(steps, function(step){
            var item = _.pick(step, [
                'role',
                'title',
                'discussionParticipation', 'seeOthersResponses',
                'blindReview'
            ]);
            item.groups = _.map(step.usergroupId, _getGroup);
            if (step.writeToAnswers === false) {
                item.surveyAccess = 'noWriteToAnswers';
            } else if (step.writeToAnswers === true) {
                item.surveyAccess = 'writeToAnswers';
            } else {
                angular.forEach(permissionFields, function(perm){
                    if (step[perm]) {
                        item.surveyAccess = perm;
                    }
                });
            }

            productWorkflow.tableParams.data.push(item);
        });
        productWorkflow.refreshDataMap();
    }

    function _refreshTemplatesList() {
        $scope.model.selectedTemplate = undefined;
        greyscaleWorkflowTemplateApi.list()
        .then(function(data){
            $scope.model.workflowTemplates = data;
        })
        .catch(greyscaleUtilsSrv.errorMsg);
    }

    function _applyWorkflowTemplate() {
        var template = $scope.model.selectedTemplate;
        $scope.model.product.workflow.name = template.workflow.name;
        $scope.model.product.workflow.description = template.workflow.description;

        _setSteps(template.steps);
        $scope.model.selectedTemplate = undefined;
    }

    function _saveCurrentWorkflowAsTemplate() {
        var template = {
            workflow: {
                name: $scope.model.product.workflow.name,
                description: $scope.model.product.workflow.description,
            },
            steps: _getSteps()
        };
        angular.forEach(template.steps, function(step, i){
            delete(template.steps[i].startDate);
            delete(template.steps[i].endDate);
            delete(template.steps[i].id);
        });
        greyscaleWorkflowTemplateApi.add(template)
            .then(_refreshTemplatesList)
            .catch(greyscaleUtilsSrv.errorMsg)
    }

});
