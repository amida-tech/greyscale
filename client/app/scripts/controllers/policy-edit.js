/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyEditCtrl', function ($scope, $state, $stateParams, $timeout, greyscaleSurveyApi,
        Organization, greyscaleUtilsSrv, greyscaleGlobals, i18n, $log) {

        var projectId,
            _policies = [],
            policyIdx = greyscaleGlobals.formBuilder.fieldTypes.indexOf('policy'),
            surveyId = $stateParams.id === 'new' ? null : $stateParams.id;

        _policiesGenerate(_policies);

        $scope.model = {
            survey: {
                isPolicy: true,
                isDraft: true
            },
            policies: _policies
        };

        $state.ext.surveyName = i18n.translate('SURVEYS.NEW_SURVEY');

        Organization.$lock = true;

        if (surveyId) {
            Organization.$watch($scope, function () {
                projectId = Organization.projectId;
                _loadSurvey();
            });
        }

        $scope.save = function () {
            $scope.$on(greyscaleGlobals.events.survey.builderFormSaved, _save);
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

                $scope.model = {
                    survey: survey,
                    policies: _policies
                };

                $scope.model.survey.isPolicy = ($scope.model.survey.policyId !== null);
                $state.ext.surveyName = survey ? survey.title : $state.ext.surveyName;

                if (projectId !== survey.projectId) {
                    Organization.$setBy('projectId', survey.projectId);
                }
            });
        }

        function _save() {
            var _survey;

            _survey = angular.extend({},$scope.model.survey);
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
    });
