/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalSaveAsWorkflowTemplateCtrl', function (_, $scope, $uibModalInstance, modalData, $timeout) {

        var workflowTemplates = modalData.templates;

        $scope.model = modalData.template.workflow;

        $scope.close = function () {
            $uibModalInstance.dismiss('close');
        };

        $scope.save = function () {
            $uibModalInstance.close(modalData.template);
        };

        $scope.validateName = function() {
            if (!$scope.dataForm) {
                return;
            }

            var inUseValid = !_.find(workflowTemplates, {workflow: {name: $scope.model.name}});
            $scope.dataForm.name.$setValidity('inUse', inUseValid);
            $timeout(function(){
                $scope.$apply();
            });
        };

        var init = $scope.$watch('dataForm.$pristine', function(){
            $scope.dataForm.name.$setDirty(true);
            $scope.validateName();
            init();
        });


});
