/**
 * Created by igi on 11.02.16.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('SurveyCtrl', function (_, $scope, $stateParams, $q, greyscaleSurveyApi, greyscaleTaskApi,
        greyscaleProfileSrv, greyscaleProductApi, greyscaleProductWorkflowApi, greyscaleLanguageApi,
        greyscaleEntityTypeApi, $log) {

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
            profile: greyscaleProfileSrv.getProfile(),
            languages: greyscaleLanguageApi.list(),
            essence: greyscaleEntityTypeApi.list({
                name: 'Survey Answers'
            })
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
                    languages: resp.languages,
                    essenceId: resp.essence[0] ? resp.essence[0].id : null,
                    flags: {}
                };
                $scope.model.title = resp.survey.title;
                return resp.task ? greyscaleProductApi.get(resp.task.productId) : $q.reject();
            })
            .then(function (product) {
                return greyscaleProductWorkflowApi.workflow(product.workflow.id).stepsList();
            })
            .then(function (steps) {
                steps = steps.plain();
                var s, qty = steps.length;
                for (s = 0; s < qty; s++) {
                    if (data.task.stepId === steps[s].id) {
                        var f, fLen = flags.length;
                        for (f = 0; f < fLen; f++) {
                            data.flags[flags[f]] = steps[s][flags[f]];
                        }
                        data.task.step = steps[s];
                    }
                }
                $log.debug('step flags', data.flags);
            })
            .finally(function () {
                $scope.model.surveyData = data;
                $scope.model.showDiscuss = ($scope.model.showDiscuss && data.flags.discussionParticipation);
                $scope.loading = false;
            });

        $scope.disableOnMove = function (msg) {
            if (msg.isReturn) {
                $scope.model.surveyData.disabledFields = true;
            }
        };

    });
