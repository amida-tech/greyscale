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

angular.module('greyscaleApp').controller('SurveyEditCtrl', function ($scope, greyscaleSurveyApi, greyscaleQuestionApi, greyscaleModalsSrv, inform, $log, $stateParams, $state) {
    var surveyId = $stateParams.surveyId;
    
    var _newSurvey;
    greyscaleSurveyApi.get(surveyId).get().then(function (newSurvey) {
        $scope.model = {
            survey: newSurvey
        };
        $state.ext.surveyName = newSurvey ? newSurvey.title : 'New survey';
        //return greyscaleModalsSrv.editSurvey(newSurvey);
    });
    
    $scope.save = function () {
        (function () {
            _newSurvey = $scope.model.survey;
            //TODO remove
            _newSurvey.productId = 2;
            if (_newSurvey.id) {
                return greyscaleSurveyApi.update(_newSurvey);
            } else {
                return greyscaleSurveyApi.add(_newSurvey);
            }
        })().then(function (newSurvey) {
            if (!newSurvey) newSurvey = _newSurvey;
            var questionsFunctions = [];
            for (var i = 0; i < newSurvey.questions.length; i++) {
                questionsFunctions.push(new Promise(_getQuestionFunction(_newSurvey, newSurvey.questions[i])));
            }
            return Promise.all(questionsFunctions).then(function () {
                debugger;
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
        $state.go('survey');
    };

    function _getQuestionFunction(_newSurvey, question) {
        return function (newSurvey) {
            question.surveyId = newSurvey && newSurvey.id ? newSurvey.id : _newSurvey.id;
            if (question.deleted) {
                return greyscaleQuestionApi.delete(question);
            } else if (question.id) {
                return greyscaleQuestionApi.update(question);
            } else {
                return greyscaleQuestionApi.add(question);
            }
        }
    }
});
