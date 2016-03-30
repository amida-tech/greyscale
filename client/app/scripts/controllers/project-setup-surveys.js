'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupSurveysCtrl', function ($scope, $stateParams, greyscaleModalsSrv,
        greyscaleProjectApi, greyscaleProjectSurveysTbl, Organization) {

        var surveys = greyscaleProjectSurveysTbl;

        $scope.model = {
            surveys: surveys
        };

        Organization.$watch($scope, _renderSurveysTable);

        function _renderSurveysTable() {
            surveys.dataFilter.projectId = Organization.projectId;
            if (surveys.tableParams) {
                surveys.tableParams.reload();
            }
        }

    });
