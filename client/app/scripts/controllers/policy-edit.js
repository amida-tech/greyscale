/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyEditCtrl', function ($q, $scope, $state, $stateParams, $timeout, greyscaleSurveyApi,
        Organization, greyscaleUtilsSrv, greyscaleGlobals, i18n, greyscaleProfileSrv, greyscaleUsers,
        greyscaleEntityTypeApi, greyscaleAttachmentApi) {

        var projectId,
            _policies = [],
            policyIdx = greyscaleGlobals.formBuilder.fieldTypes.indexOf('policy'),
            surveyId = $stateParams.id === 'new' ? null : $stateParams.id;

        var isPolicy = true;

        $scope.model = {
            survey: {
                isPolicy: isPolicy,
                isDraft: true,
                author: -1
            },
            policies: _policies,
            attachments: [],
            authorName: '',
            essenceId: -1
        };

        greyscaleEntityTypeApi.list({fileName: (isPolicy ? 'policies' : 'survey_answers')})
            .then(function (essences) {
                if (essences.length) {
                    $scope.model.essenceId = essences[0].id;
                }
            });

        greyscaleProfileSrv.getProfile().then(_setAuthor);

        _policiesGenerate(_policies);

        $state.ext.surveyName = i18n.translate('SURVEYS.NEW_SURVEmodel.survey.authorY');

        Organization.$lock = true;

        if (surveyId) {
            Organization.$watch($scope, function () {
                projectId = Organization.projectId;
                _loadSurvey();
            });
        }

        $scope.getAuthor = function () {
            greyscaleUsers.get($scope.model.author).then(_setAuthor);
        };

        $scope.save = function () {
            var _deregistator = $scope.$on(greyscaleGlobals.events.survey.builderFormSaved, function () {
                _deregistator();
                _save();
            });
            $scope.saveFormbuilder();
        };

        $scope.cancel = function () {
            $state.go('projects.setup.surveys', {
                projectId: projectId
            });
        };

        $scope.publish = _publish;

        function _loadSurvey() {
            greyscaleSurveyApi.get(surveyId).then(function (survey) {
                var _questions = [],
                    qty = survey.questions.length,
                    q;

                _policies = [];
                for (q = 0; q < qty; q++) {
                    if (survey.questions[q].type === policyIdx) {
                        _policies.push(survey.questions[q]);
                    } else {
                        _questions.push(survey.questions[q]);
                    }
                }

                _policiesGenerate(_policies);

                survey.questions = _questions;

                $scope.model.survey = survey;
                $scope.model.policies = _policies;

                greyscaleUsers.get($scope.model.survey.author).then(_setAuthor);

                $scope.model.survey.isPolicy = ($scope.model.survey.policyId !== null);

                if ($scope.model.survey.isPolicy) {
                    _getAttacments();

                }
                $state.ext.surveyName = survey ? survey.title : $state.ext.surveyName;

                if (projectId !== survey.projectId) {
                    Organization.$setBy('projectId', survey.projectId);
                }
            });
        }

        function _getAttacments() {
            greyscaleAttachmentApi.list($scope.model.essenceId, $scope.model.survey.policyId)
                .then(function (_attachments) {
                    $scope.model.attachments = _attachments;
                });
        }

        function _save() {
            var _survey;

            _survey = angular.extend({}, $scope.model.survey);
            _survey.projectId = projectId;
            _survey.isPolicy = true;

            var _questions = $scope.model.survey.questions;

            if (surveyId) {
                _survey.id = surveyId;
            }

            if (_survey.questions) {
                _survey.questions = _survey.questions.concat($scope.model.policies);
            } else {
                _survey.questions = $scope.model.policies;
            }

            (_survey.id ? greyscaleSurveyApi.update(_survey) : greyscaleSurveyApi.add(_survey))
                .then(function (resp) {
                    $scope.model.survey.questions = _questions;
                    if (!_survey.id) {
                        $scope.model.survey.id = resp.id;
                    }

                    $state.go('policy', {
                        projectId: projectId
                    });
                })
                .catch(function (err) {
                    greyscaleUtilsSrv.errorMsg(err, 'ERROR.SURVEY_UPDATE_ERROR');
                });
        }

        var firstSave = $scope.$on(greyscaleGlobals.events.survey.builderFormSaved, function () {
            $scope.dataForm.$dirty = true;
            $timeout(function () {
                $scope.$digest();
            });
            firstSave();
        });

        $scope.$on(greyscaleGlobals.events.survey.answerDirty, function () {
            $scope.dataForm.$setDirty();
        });

        $scope.$on('$destroy', function () {
            Organization.$lock = false;
        });

        function _publish() {
            $scope.model.survey.isDraft = false;
            $scope.save();
        }

        function _policiesGenerate(_policies) {
            var q = _policies.length;

            for (q; q < greyscaleGlobals.formBuilder.policyQty; q++) {
                _policies.push({
                    type: policyIdx,
                    surveyId: surveyId,
                    label: 'POLICY.SECTION_' + q,
                    description: ''
                });
            }
        }

        function _setAuthor(profile) {
            $scope.model.survey.author = profile.id;
            $scope.model.authorName = greyscaleUtilsSrv.getUserName(profile);
        }
    });
