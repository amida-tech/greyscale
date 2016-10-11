'use strict';

angular.module('greyscale.rest').factory('greyscaleQuestionApi', function (greyscaleRestSrv) {

    var _api = function () {
        return greyscaleRestSrv.api().one('questions');
    };
    var _apiSurvey = function () {
        return greyscaleRestSrv.api().one('surveys');
    };

    function _getQuestion(surveyId) {
        return _apiSurvey().one(surveyId + '/questions');
    }

    function _deleteQuestion(question) {
        return _api().one(question.id + '').remove();
    }

    function _updateQuestion(question) {
        return _api().one(question.id + '').customPUT(question);
    }

    function _addQuestion(question) {
        return _apiSurvey().one(question.surveyId + '/questions').customPOST(question);
    }

    return {
        get: _getQuestion,
        update: _updateQuestion,
        delete: _deleteQuestion,
        add: _addQuestion
    };
});
