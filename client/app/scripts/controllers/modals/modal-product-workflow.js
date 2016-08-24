'use strict';
angular.module('greyscaleApp')
.controller('ModalProductWorkflowCtrl', function (_, $scope,
    $uibModalInstance, i18n,
    modalData, Organization, greyscaleModalsSrv,
    greyscaleProductWorkflowTbl,
    greyscaleWorkflowTemplateApi,
    greyscaleUtilsSrv, $timeout) {

    var product = modalData.product;

    var productWorkflow = greyscaleProductWorkflowTbl;

    var workflowId = product.workflow ? product.workflow.id : undefined;
    productWorkflow.dataFilter.workflowId = workflowId;
    productWorkflow.dataFilter.organizationId = Organization.id;
    productWorkflow.dataFilter.product = product;

    productWorkflow.dragSortable = {onChange: _validateDates};

    $scope.modalData = angular.copy(modalData);
    $scope.model = {
        product: angular.copy(product),
        productWorkflow: productWorkflow
    };

    var ctrl = this;
    var tplEdit = $scope.tplEdit = productWorkflow.dataFilter.tplEdit = !product.projectId;

    if (tplEdit) {
        $timeout(function(){
            _addValidators(ctrl.dataForm);
        });

    } else {
        _refreshTemplatesList();
    }


    productWorkflow.dataFilter.templateMode = tplEdit;

    productWorkflow.dataFilter.saveAsTemplate = _saveCurrentWorkflowAsTemplate;

    productWorkflow.dataFilter.saveAsTemplateDisable = function(){
        return !_validateWorkflowSteps(true);
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        var steps = _getSteps();
        var resolveData = {
            workflow: $scope.model.product.workflow || {},
            steps: steps
        };
        if (tplEdit) {
            resolveData.id = product.id;
        } else {
            resolveData.workflow.productId = product.id;
        }
        $uibModalInstance.close(resolveData);
    };

    $scope.validWorkflowSteps = _validateWorkflowSteps;

    $scope.applyWorkflowTemplate = _applyWorkflowTemplate;

    $scope.saveAsTemplate = _saveCurrentWorkflowAsTemplate;

    $scope.$on('form-field-change', function(e,data){
        switch (data.field) {
            case 'startDate':
            case 'endDate':
                _validateDates();
            break;
        }
    });

    var _allDatesValid = true;
    var errorMsgTimer;
    function _validateDates() {
        var tableData = productWorkflow.tableParams.data;
        var steps = _getSteps();
        var lastDate;
        _allDatesValid = true;
        angular.forEach(steps, function(step, i){
            var startDate = step.startDate ? new Date(Date.parse(step.startDate)) : null;
            var endDate = step.endDate ? new Date(Date.parse(step.endDate)) : null;
            step.startDateInvalid = startDate && lastDate && startDate < lastDate;
            if (startDate) {
                lastDate = startDate;
            }
            step.endDateInvalid = endDate && lastDate && endDate < lastDate;
            if (endDate) {
                lastDate = endDate;
            }
            if (step.startDateInvalid || step.endDateInvalid) {
                _allDatesValid = false;
            }
            tableData[i].startDateInvalid = step.startDateInvalid;
            tableData[i].endDateInvalid = step.endDateInvalid;
        });
        if (!_allDatesValid) {
            if (errorMsgTimer) {
                $timeout.cancel(errorMsgTimer);
            }
            errorMsgTimer = $timeout(function(){
                greyscaleUtilsSrv.errorMsg('PRODUCTS.WORKFLOW.STEPS.DATES_ORDER_ERROR');
            }, 50);
        }
    }

    function _validateWorkflowSteps(forTemplate) {
        var steps = _getSteps();
        var valid = 0;
        angular.forEach(steps, function(step){
            if (step.title && step.title !== '' &&
                step.role && step.role !== '' &&
                (tplEdit || forTemplate || _allDatesValid) &&
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
            item.startDate = undefined;
            item.endDate = undefined;
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

    function _refreshTemplatesList(currentTemplateId) {
        return greyscaleWorkflowTemplateApi.list()
        .then(function(data){
            $scope.model.workflowTemplates = data;
            if (!tplEdit) {
                var apply;

                if (!product.workflow && product.workflowTemplateId && !currentTemplateId) {
                    currentTemplateId = product.workflowTemplateId;
                    apply = true;
                }

                $scope.model.selectedTemplate = currentTemplateId ?
                    _.find(data, {id: currentTemplateId}) : undefined;

                if (apply && $scope.model.selectedTemplate) {
                    productWorkflow.$loading = true;
                    $timeout(function(){
                        _applyWorkflowTemplate(true);
                        productWorkflow.$loading = false;
                    });
                }
            }
        })
        .catch(greyscaleUtilsSrv.errorMsg);
    }

    function _applyWorkflowTemplate(force) {
        var template = $scope.model.selectedTemplate;
        var workflow = $scope.model.product.workflow = $scope.model.product.workflow || {};
        workflow.name = template.workflow.name;
        workflow.description = template.workflow.description;

        _setSteps(template.steps);
        if (!force) {
            $scope.model.selectedTemplate = undefined;
        }
    }

    function _saveCurrentWorkflowAsTemplate() {

        var workflowTemplateName = $scope.model.product.workflow.name;

        var template = {
            workflow: {
                name: workflowTemplateName,
                description: $scope.model.product.workflow.description,
            },
            steps: _getSteps()
        };

        if (workflowTemplateName && workflowTemplateName !== '' && _isUniqueName(workflowTemplateName)) {
            _saveWorkflowTemplate(template);
        } else {
            greyscaleModalsSrv.saveAsWorkflowTemplate({
                template: template,
                templates: $scope.model.workflowTemplates
            })
            .then(_saveWorkflowTemplate);
        }
    }

    function _saveWorkflowTemplate(template) {
        angular.forEach(template.steps, function(step, i){
            delete(template.steps[i].startDate);
            delete(template.steps[i].endDate);
            delete(template.steps[i].id);
        });
        greyscaleWorkflowTemplateApi.add(template)
        .then(function(data) {
            return _refreshTemplatesList(data.id);
        })
        .then(function(){
            $scope.model.templateSaved = true;
            $timeout(function(){
                $scope.model.templateSaved = false;
            }, 2000);
        })
        .catch(greyscaleUtilsSrv.errorMsg)
    }

    function _addValidators(ngForm) {
        ngForm.name.$parsers.unshift(function(value){
            var valid = _isUniqueName(value);
            ngForm.name.$setValidity('unique', valid);
            return valid ? value : undefined;
        });
        ngForm.name.$formatters.unshift(function(value){
            var valid = _isUniqueName(value);
            ngForm.name.$setValidity('unique', valid);
            return value;
        });
    }

    function _isUniqueName(name) {
        if (tplEdit && name === product.workflow.name) {
            return true;
        }
        return !_.find($scope.model.workflowTemplates, {workflow: {name: name}});
    }
});
