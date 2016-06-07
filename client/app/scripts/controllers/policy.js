/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyCtrl', function ($scope, $stateParams, greyscaleModalsSrv,
        greyscaleProjectApi, greyscaleProjectSurveysTbl, Organization, $state) {

        var surveys = greyscaleProjectSurveysTbl;

        surveys.mode = 'policy';

        $scope.model = {
            surveys: surveys
        };

        Organization.$watch($scope, _renderSurveysTable);

        function _renderSurveysTable() {
            if (!Organization.enableFeaturePolicy) {
                $state.go('home');
            } else {
                surveys.dataFilter.projectId = Organization.projectId;
                if (surveys.tableParams) {
                    surveys.tableParams.reload();
                }
            }
        }
    });
