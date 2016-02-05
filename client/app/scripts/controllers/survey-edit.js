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

angular.module('greyscaleApp').controller('SurveyEditCtrl', function ($scope, greyscaleSurveyApi, greyscaleQuestionApi, greyscaleModalsSrv, inform, $log, $stateParams, $state, $q) {
    var surveyId = $stateParams.surveyId;
    var projectId = $stateParams.projectId;

    var _survey;
    if (surveyId >= 0) {
        greyscaleSurveyApi.get(surveyId).get().then(function (survey) {
            $scope.model = {
                survey: survey
            };
            $state.ext.surveyName = survey ? survey.title : 'New survey';
            //return greyscaleModalsSrv.editSurvey(survey);
        });
    } else {
        $scope.model = {
            survey: {}
        };
        $state.ext.surveyName = 'New survey';
    }

    $scope.save = function () {
        _survey = $scope.model.survey;
        _survey.projectId = projectId;
        (_survey.id ? greyscaleSurveyApi.update(_survey) : greyscaleSurveyApi.add(_survey)).then(function (survey) {
            if (!survey) {
                survey = _survey;
            } else {
                survey.questions = _survey.questions;
            }
            for (var j = 0; j < survey.questions.length; j++) {
                survey.questions[j].surveyId = survey.id;
            }
            var questionsFunctions = [];
            if (survey.questions) {
                for (var i = 0; i < survey.questions.length; i++) {
                    questionsFunctions.push(_getQuestionFunction(survey.questions[i]));
                }
            }
            return $q.all(questionsFunctions);
        }).then(function () {
            $state.go('projects.setup.surveys', {
                projectId: projectId
            });
        }).catch(function (err) {
            if (!err) {
                return;
            }
            $log.debug(err);
            var msg = 'Survey update error';
            if (err.data && err.data.message) {
                msg += ': ' + err.data.message;
            }
            inform.add(msg, {
                type: 'danger'
            });
        });
    };
    $scope.cancel = function () {
        $state.go('projects.setup.surveys', {
            projectId: projectId
        });
    };

    function _getQuestionFunction(question) {
        if (question.deleted) {
            return greyscaleQuestionApi.delete(question);
        } else if (question.id) {
            return greyscaleQuestionApi.update(question);
        } else {
            return greyscaleQuestionApi.add(question);
        }
    }
});
