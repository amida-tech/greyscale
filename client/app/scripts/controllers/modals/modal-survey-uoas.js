'use strict';
angular.module('greyscaleApp')
.controller('ModalSurveyUoasCtrl', function ($scope, $uibModalInstance, greyscaleSurveyUoas) {

    console.log($scope);

    var surveyUoas = greyscaleSurveyUoas;
    $scope.model = {
        surveyUoas: surveyUoas
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        $uibModalInstance.close($scope.model);
    };

});
