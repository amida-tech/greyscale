/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyReviewCtrl', function ($scope, $state, $stateParams, $q, greyscaleSurveyApi, greyscaleTaskApi,
        greyscaleProfileSrv, greyscaleProductApi, greyscaleProductWorkflowApi, greyscaleLanguageApi, greyscaleUoaApi,
        greyscaleEntityTypeApi, greyscaleGlobals, greyscaleUtilsSrv, greyscaleUsers, greyscaleAttachmentApi) {
        $scope.loading = true;
        $scope.model = {
            id: $stateParams.id,
            title: '',
            surveyData: null,
            showDiscuss: false
        };

        if (!$scope.model.id) {
            $state.go('policy');
        }

        var data = {},
            _title = [],
            reqs = {
                survey: greyscaleSurveyApi.get($stateParams.id),
                profile: greyscaleProfileSrv.getProfile(),
                languages: greyscaleLanguageApi.list(),
                essence: greyscaleEntityTypeApi.list({
                    name: 'Survey Answers'
                })
            };

        $q.all(reqs)
            .then(function (resp) {
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
                            readonly: true
                        },
                        sections: [],
                        attachments: []
                    }
                };

                greyscaleEntityTypeApi.getByFile('policies')
                    .then(function (essence) {
                        data.policy.essenceId = essence.id;
                        return greyscaleAttachmentApi.list(essence.id, data.policy.id);
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
