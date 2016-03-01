/**
 * Created by igi on 11.02.16.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('SurveyCtrl', function ($scope, $stateParams, $q, greyscaleSurveyApi, greyscaleTaskApi,
        greyscaleProfileSrv, greyscaleProductApi, greyscaleProductWorkflowApi, $log) {

        $scope.loading = true;

        $scope.model = {
            title: '',
            surveyData: null,
            showDiscuss: $stateParams.taskId
        };

        var data = {};

        var flags = [
            'allowEdit',
            'allowTranslate',
            'blindReview',
            'discussionParticipation',
            'provideResponses',
            'seeOthersResponses',
            'writeToAnswers'
        ];

        var reqs = {
            survey: greyscaleSurveyApi.get($stateParams.surveyId),
            profile: greyscaleProfileSrv.getProfile()
        };

        if ($stateParams.taskId) {
            reqs.task = greyscaleTaskApi.get($stateParams.taskId);
        }

        $q.all(reqs)
            .then(function (resp) {
                data = {
                    survey: resp.survey,
                    task: resp.task,
                    userId: resp.profile.id,
                    flags:{}
                };
                $scope.model.title = resp.survey.title;
                return greyscaleProductApi.get(resp.task.productId);
            })
            .then(function (product) {
                return greyscaleProductWorkflowApi.workflow(product.workflow.id).stepsList();
            })
            .then(function (steps) {
                steps = steps.plain();
                var s, qty = steps.length;
                for (s = 0; s < qty; s++) {
                    if (data.task.stepId == steps[s].id) {
                        var f, fLen = flags.length;
                        for (f=0;f<fLen;f++) {
                            data.flags[flags[f]] = steps[s][flags[f]];
                        }
                    }
                }
                $log.debug(data.flags);
                $scope.model.surveyData = data;
                $scope.model.showDiscuss = ($scope.model.showDiscuss && data.flags.discussionParticipation);
            })
            .finally(function () {
                $scope.loading = false;
            });
    });
