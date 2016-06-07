/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyReviewCtrl', function ($scope, $state, $stateParams, $q, greyscaleSurveyApi, greyscaleTaskApi,
        greyscaleProfileSrv, greyscaleLanguageApi, greyscaleEntityTypeApi, greyscaleGlobals, greyscaleUtilsSrv,
        greyscaleUsers, greyscaleCommentApi, $log) {

        var data = {},
            _title = [],
            reqs = {
                survey: greyscaleSurveyApi.get($stateParams.id),
                profile: greyscaleProfileSrv.getProfile(),
                languages: greyscaleLanguageApi.list(),
                essence: greyscaleEntityTypeApi.list({
                    name: 'Survey Answers'
                })
            },
            surveyId = $stateParams.id,
            taskId = $stateParams.taskId;

        $scope.loading = true;
        $scope.model = {
            id: surveyId,
            title: '',
            surveyData: null,
            showDiscuss: false
        };

        if (!$scope.model.id) {
            $state.go('policy');
        }

        if (taskId) {
            reqs.task = greyscaleTaskApi.get(taskId);
            reqs.scopeList = greyscaleCommentApi.scopeList({
                taskId: taskId
            });
        }

        $q.all(reqs)
            .then(function (resp) {
                var i, qty;

                data = {
                    survey: resp.survey,
                    userId: resp.profile.id,
                    languages: resp.languages.plain(),
                    essenceId: resp.essence[0] ? resp.essence[0].id : null,
                    flags: {},
                    policy: {
                        id: resp.survey.policyId,
                        title: resp.survey.title,
                        section: resp.survey.section,
                        subsection: resp.survey.subsection,
                        number: resp.survey.number,
                        options: {
                            readonly: true,
                            isPolicy: true
                        },
                        surveyId: resp.survey.id,
                        taskId: resp.task ? resp.task.id : null,
                        userId: resp.profile.id,
                        sections: [],
                        attachments: [],
                        associate: resp.scopeList ? resp.scopeList.availList : []
                    }
                };

                qty = data.policy.associate.length;
                for (i = 0; i < qty; i++) {
                    data.policy.associate[i].fullName = greyscaleUtilsSrv.getUserName(data.policy.associate[i]);
                }

                greyscaleEntityTypeApi.getByFile('policies')
                    .then(function (essence) {
                        data.policy.essenceId = essence.id;
                        $log.debug('re-factor policy review attachments to S3');
                        /*
                        return greyscaleAttachmentApi.list(essence.id, data.policy.id);
                        */
                        return [];
                    })
                    .then(function (attachments) {
                        data.policy.attachments = attachments;
                    });

                greyscaleUsers.get(data.survey.author).then(function (profile) {
                    data.policy.authorName = greyscaleUtilsSrv.getUserName(profile);
                });

                _separatePolicy(data);

                _title = [data.survey.title];
            })
            .finally(function () {
                $scope.model.title = _title.join(' - ');
                $scope.model.surveyData = data;
                $scope.model.showDiscuss = true;
                $scope.loading = false;
            });

        function _separatePolicy(data) {
            var q,
                policyIdx = greyscaleGlobals.formBuilder.fieldTypes.indexOf('policy'),
                _survey = data.survey,
                _questions = [],
                _sections = [],
                qty = _survey.questions.length;

            for (q = 0; q < qty; q++) {
                if (_survey.questions[q].type === policyIdx) {
                    _sections.push(_survey.questions[q]);
                } else {
                    _questions.push(_survey.questions[q]);
                }
            }
            _survey.questions = _questions;
            data.policy.sections = _sections;
        }
    });
