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
            surveyData: null,
            showDiscuss: false
        };

        var reqs = {
            survey: greyscaleSurveyApi.get($stateParams.surveyId),
            profile: greyscaleProfileSrv.getProfile()
        };

        if ($stateParams.taskId) {
            reqs.task = greyscaleTaskApi.get($stateParams.taskId);
        }

        $q.all(reqs)
            .then(function (resp) {
                $scope.model.surveyData = {
                    survey: resp.survey,
                    task: resp.task,
                    userId: resp.profile.id
                };
                $scope.model.showDiscuss = (resp.task && resp.task.id && resp.task.accessToDiscussions);
                $scope.model.title = resp.survey.title;
            })
            .finally(function () {
                $scope.loading = false;
            });
    });
