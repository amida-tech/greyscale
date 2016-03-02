'use strict';
angular.module('greyscaleApp')
    .controller('ModalAnswerVersionCtrl', function ($scope, $uibModalInstance, $stateParams, params, greyscaleSurveyAnswerApi, _) {
    params = params || {};    
    
    $scope.params = params;
    
    greyscaleSurveyAnswerApi.list({ questionId: params.field.id, taskId: $stateParams.taskId }).then(function (_answers) {
        _answers = _.sortBy(_answers, 'version');
        $scope.answers = _answers;
    });
    
    $scope.close = function () {
        $uibModalInstance.close($scope.model);
    };
    $scope.getOptionLabel = function (optionId) {
        if (!optionId) return;
        for (var i = 0; i < $scope.params.field.options.length; i++) {
            if (optionId !== $scope.params.field.options[i].id) continue;
            return (i + 1) + '. ' + $scope.params.field.options[i].label;
        }
    }
});
