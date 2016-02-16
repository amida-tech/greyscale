/**
 * Created by igi on 11.02.16.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('SurveyCtrl', function ($scope, $stateParams, $q, greyscaleSurveyApi, greyscaleTaskApi,
        greyscaleProfileSrv, $log) {

        $scope.loading = true;

        $scope.model = {
            title: '',
            surveyData: null
        };

        $q.all({
                task: greyscaleTaskApi.get($stateParams.taskId),
                survey: greyscaleSurveyApi.get($stateParams.surveyId),
                profile: greyscaleProfileSrv.getProfile()
            })
            .then(function (resp) {
                $scope.model.surveyData = {
                    survey: resp.survey,
                    task: resp.task,
                    userId: resp.profile.id
                };
                $scope.model.title = resp.survey.title;
            })
            .finally(function () {
                $scope.loading = false;
            });
    });
