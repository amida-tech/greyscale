/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyEditCtrl', function (_, $q, $scope, $state, $stateParams, $timeout, greyscaleSurveyApi,
        Organization, greyscaleUtilsSrv, greyscaleGlobals, i18n, greyscaleProfileSrv, greyscaleUsers,
        greyscaleEntityTypeApi) {

        var projectId,
            policyIdx = greyscaleGlobals.formBuilder.fieldTypes.indexOf('policy'),
            surveyId = $stateParams.id === 'new' ? null : $stateParams.id;

        var isPolicy = true;

        $scope.model = {
            survey: {
                isPolicy: isPolicy,
                isDraft: true,
                author: -1
            },
            policy: {
                id: null,
                title: '',
                section: '',
                subsection: '',
                number: '',
                author: -1,
                authorName: '',
                essenceId: -1,
                options: {
                    readonly: false,
                    canImport: true
                },
                sections: [],
                attachments: []
            }
        };

        greyscaleEntityTypeApi.list({
                tableName: (isPolicy ? 'Policies' : 'SurveyAnswers')
            })
            .then(function (essences) {
                if (essences.length) {
                    $scope.model.policy.essenceId = essences[0].id;
                }
            });

        greyscaleProfileSrv.getProfile().then(_setAuthor);

        _policiesGenerate($scope.model.policy.sections);

        $state.ext.surveyName = i18n.translate('SURVEYS.NEW_SURVEY');

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
                    _sections = [],
                    qty = survey.questions ? survey.questions.length : 0,
                    q,
                    canImport = $scope.model.policy.options.canImport;

                $scope.model.survey.isPolicy = ($scope.model.survey.policyId !== null);

                if ($scope.model.survey.isPolicy) {
                    angular.extend($scope.model.policy, {
                        id: survey.policyId,
                        title: survey.title,
                        section: survey.section,
                        subsection: survey.subsection,
                        number: survey.number,
                        attachments: survey.attachments || []
                    });

                    for (q = 0; q < qty; q++) {
                        if (survey.questions[q].type === policyIdx) {
                            _sections.push(survey.questions[q]);
                            canImport = canImport && (!survey.questions[q].description);
                        } else {
                            _questions.push(survey.questions[q]);
                        }
                    }

                    _policiesGenerate(_sections);
                    survey.questions = _questions;
                    $scope.model.survey = survey;
                    $scope.model.policy.options.canImport = canImport;
                    $scope.model.policy.sections = _sections;

                    greyscaleUsers.get($scope.model.survey.author).then(_setAuthor);

                    $scope.model.policy.answerId = survey.policyId;

                }
                $state.ext.surveyName = survey ? survey.title : $state.ext.surveyName;

                if (projectId !== survey.projectId) {
                    Organization.$setBy('projectId', survey.projectId);
                }
            });
        }

        function _save() {
            var _survey,
                _policy = $scope.model.policy;

            _survey = angular.extend({}, $scope.model.survey);
            _survey.projectId = projectId;
            _survey.isPolicy = true;

            var _questions = $scope.model.survey.questions;

            if (surveyId) {
                _survey.id = surveyId;
            }
            angular.extend(_survey, {
                policyId: _policy.id,
                title: _policy.title,
                section: _policy.section,
                subsection: _policy.subsection,
                number: _policy.number,
                author: _policy.author,
                attachments: _.map(_policy.attachments, 'id')
            });

            _reinitPolicySections($scope.model.policy.sections);

            if (_survey.questions) {
                _survey.questions = _survey.questions.concat($scope.model.policy.sections);
            } else {
                _survey.questions = $scope.model.policy.sections;
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

        function _policiesGenerate(_sections) {
            var q = _sections.length;

            for (q; q < greyscaleGlobals.formBuilder.policyQty; q++) {
                _sections.push({
                    type: policyIdx,
                    surveyId: surveyId,
                    label: 'POLICY.SECTION_' + q,
                    description: ''
                });
            }
        }

        function _reinitPolicySections(sections) {
            var i,
                qty = sections.length;

            for (i = 0; i < qty; i++) {
                angular.extend(sections[i], {
                    type: policyIdx,
                    surveyId: surveyId
                });
            }
        }

        function _setAuthor(profile) {
            $scope.model.policy.author = profile.id;
            $scope.model.policy.authorName = greyscaleUtilsSrv.getUserName(profile);
        }
    });
