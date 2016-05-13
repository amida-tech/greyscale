/**
 * Created by igi on 11.02.16.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('SurveyCtrl', function ($scope, $stateParams, $q, greyscaleSurveyApi, greyscaleTaskApi,
        greyscaleProfileSrv, greyscaleProductApi, greyscaleProductWorkflowApi, greyscaleLanguageApi,
        greyscaleEntityTypeApi, greyscaleUoaApi, greyscaleDiscussionApi, $location, $state) {

        $scope.loading = true;

        $scope.model = {
            title: '',
            surveyData: null,
            showDiscuss: $stateParams.taskId
        };

        var data = {};
        var _title = [];

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
            reqs.scopeList = greyscaleDiscussionApi.scopeList({
                taskId: $stateParams.taskId
            });
        }

        $q.all(reqs)
            .then(function (resp) {
                data = {
                    survey: resp.survey,
                    task: resp.task ? resp.task.plain() : null,
                    resolveData: resp.scopeList ? _getResolveData(resp.scopeList) : null,
                    userId: resp.profile.id,
                    languages: resp.languages.plain(),
                    essenceId: resp.essence[0] ? resp.essence[0].id : null,
                    flags: {}
                };
                if (data.resolveData) {
                    _setQuestionFlag();
                }
                _title = [data.survey.title];
                return resp.task ? $q.all({
                    product: greyscaleProductApi.get(resp.task.productId),
                    uoa: greyscaleUoaApi.get({
                        id: data.task.uoaId
                    })
                }) : $q.reject();
            })
            .then(function (resp) {
                _title = [];
                if (resp.product) {
                    data.product = resp.product.plain();
                    _title.push(data.product.title);
                }
                if (resp.uoa) {
                    data.uoa = resp.uoa.plain();
                    _title.push(data.uoa.name);
                }
                return data.product ? greyscaleProductWorkflowApi.workflow(data.product.workflow.id).stepsList() :
                    $q.reject();
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
                        _title.push(data.task.step.title);
                    }
                }
            })
            .finally(function () {
                $scope.model.title = _title.join(' - ');
                $scope.model.surveyData = data;
                $scope.model.showDiscuss = ($scope.model.showDiscuss && data.flags.discussionParticipation);
                $scope.loading = false;
            });

        $scope.disableOnMove = function (msg) {
            if (msg.isReturn) {
                $scope.model.surveyData.disabledFields = true;
            }
        };

        function _getResolveData(scopeList){
            var resolveList = scopeList.resolveList;
            return resolveList[0];
        }

        function _setQuestionFlag() {
            var flagQuestion = $location.hash();
            var match = flagQuestion.match(/^question(\d+)$/);
            if (!match) {
                $state.go('survey', {surveyId: data.survey.id, task: data.task.id, '#': 'question' + data.resolveData.questionId});
            }
        }
    });
