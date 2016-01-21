'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupSurveysCtrl', function ($scope, $stateParams, greyscaleModalsSrv, greyscaleProjectApi, greyscaleProjectSurveysTbl) {

        $scope.addUoas = function () {
            return greyscaleModalsSrv.uoasFilter()
                .then(function () {
                    console.log('add filtered uoas to product');
                });
        };

        var surveys = greyscaleProjectSurveysTbl;

        $scope.model = {
            surveys: surveys
        };

        greyscaleProjectApi.get($stateParams.projectId)
            .then(function (project) {
                surveys.dataFilter.projectId = project.id;
                surveys.tableParams.reload();
            });
    });
