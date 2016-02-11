'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleSurveyApi', function (greyscaleRestSrv) {

        return {
            list: _surveys,
            get: _getSurvey,
            add: _addSurvey,
            update: _updateSurvey,
            delete: _deleteSurvey
        };

        function _api() {
            return greyscaleRestSrv().one('surveys');
        }

        function _surveys() {
            return _api().get();
        }

        function _getSurvey(surveyId) {
            return _api().one(surveyId + '');
        }

        function _addSurvey(survey) {
            return _api().customPOST(survey);
        }

        function _deleteSurvey(survey) {
            return _api().one(survey.id + '').remove();
        }

        function _updateSurvey(survey) {
            return _api().one(survey.id + '').customPUT(survey);
        }
    });
