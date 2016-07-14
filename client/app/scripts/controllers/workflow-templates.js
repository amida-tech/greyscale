angular.module('greyscaleApp')
    .controller('WorkflowTemplatesCtrl', function ($scope, greyscaleWorkflowTemplatesTbl) {
        $scope.model = {
            workflowTemplates: greyscaleWorkflowTemplatesTbl
        };
    });
