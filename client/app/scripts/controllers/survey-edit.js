/**
 * Created by vkopytov on 21.12.15.
 *
 * @ngdoc function
 * @name greyscaleApp.controller:SurveyCtrl
 * @description
 * # SurveyCtrl
 * Controller of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp')
    .controller('SurveyEditCtrl', function ($scope, $state, $stateParams, $timeout, greyscaleSurveyApi,
        Organization, greyscaleUtilsSrv, greyscaleGlobals, i18n) {

        var surveyId = $stateParams.surveyId === 'new' ? null : $stateParams.surveyId,
            projectId,
            surveyEvents = greyscaleGlobals.events.survey;

        Organization.$lock = true;

        $scope.model = {
            loading: false,
            survey: {
                id: surveyId
            }
        };

        $state.ext.surveyName = i18n.translate('SURVEYS.NEW_SURVEY');

        if (surveyId) {
            Organization.$watch($scope, function () {
                projectId = Organization.projectId;
                $scope.model.loading = true;
                _loadSurvey();
            });
        }

        function _loadSurvey() {
            greyscaleSurveyApi.get(surveyId)
                .then(function (survey) {
                    $scope.model = {
                        survey: survey
                    };
                    $state.ext.surveyName = survey ? survey.title : $state.ext.surveyName;

                    if (projectId !== survey.projectId) {
                        Organization.$setBy('projectId', survey.projectId);
                    }
                })
                .finally(function () {
                    $scope.model.loading = false;
                });
        }

        function _save() {
            var _survey;

            _survey = $scope.model.survey;
            _survey.projectId = projectId;

            (_survey.id ? greyscaleSurveyApi.update(_survey) : greyscaleSurveyApi.add(_survey))
            .then(function () {
                    $state.go('projects.setup.surveys', {
                        projectId: projectId
                    });
                })
                .catch(function (err) {
                    greyscaleUtilsSrv.errorMsg(err, 'ERROR.SURVEY_UPDATE_ERROR');
                });
        }

        $scope.save = function () {
            var _deregistrator = $scope.$on(greyscaleGlobals.events.survey.builderFormSaved, function () {
                _save();
                _deregistrator();
            });
            $timeout(function () {
                $scope.$broadcast(surveyEvents.extSave);
            });
        };

        $scope.cancel = function () {
            $state.go('projects.setup.surveys', {
                projectId: projectId
            });
        };

        var firstSave = $scope.$on(greyscaleGlobals.events.survey.builderFormSaved, function () {
            $scope.dataForm.$setDirty();
            $timeout(function () {
                $scope.$digest();
            });
            firstSave();
        });
    });
