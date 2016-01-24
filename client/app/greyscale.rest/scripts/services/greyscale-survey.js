/**
 * Created by dTseytlin on 30.11.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleSurveyApi', function (greyscaleRestSrv) {

        var _api = function () {
            return greyscaleRestSrv().one('survey');
        };

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

        var _updateSurvey = function (survey) {
            return _api().one(survey.id + '').customPUT(survey);
        };

        return {
            list: _surveys,
            get: _getSurvey,
            add: _addSurvey,
            update: _updateSurvey,
            delete: _deleteSurvey
        };
    });
