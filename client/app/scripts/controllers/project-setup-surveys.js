'use strict';

angular.module('greyscaleApp')
.controller('ProjectSetupSurveysCtrl', function ($scope, $stateParams, greyscaleModalsSrv, greyscaleProjectSrv, greyscaleProjectSurveys) {

    $scope.addUoas = function () {
        return greyscaleModalsSrv.uoasFilter()
        .then(function () {
            console.log('add filtered uoas to product');
        });
    };

    var surveys = greyscaleProjectSurveys;

    $scope.model = {
        surveys: surveys
    };

    greyscaleProjectSrv.get($stateParams.projectId)
        .then(function (project) {
            surveys.dataFilter.projectId = project.id;
            surveys.tableParams.reload();
        });
});
