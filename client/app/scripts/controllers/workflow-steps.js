/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('WorkflowCtrl', function ($scope, greyscaleWorkflowStepsTbl) {
        $scope.model = {
            workflow: greyscaleWorkflowStepsTbl
        };
    });
