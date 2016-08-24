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

        function _plainResp(resp) {
            if (resp && resp.plain && typeof resp.plain === 'function') {
                resp = resp.plain();
            }
            return resp;
        }

        function _api() {
            return greyscaleRestSrv().one('surveys');
        }

        function _surveys() {
            return _api().get().then(_plainResp);
        }

        function _getSurvey(surveyId, params) {
            return _api().one(surveyId + '').get(params).then(_plainResp);
        }

        function _addSurvey(survey) {
            return _api().customPOST(survey).then(_plainResp);
        }

        function _deleteSurvey(survey) {
            return _api().one(survey.id + '').remove().then(_plainResp);
        }

        function _updateSurvey(survey, params) {
            return _api().one(survey.id + '').customPUT(survey, null, params).then(_plainResp);
        }
    });
