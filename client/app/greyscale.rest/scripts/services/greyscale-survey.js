'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleSurveyApi', function (greyscaleRestSrv, greyscaleUtilsSrv) {

        return {
            list: _surveys,
            get: _getSurvey,
            add: _addSurvey,
            update: _updateSurvey,
            delete: _deleteSurvey,
            versions: _listVersions,
            getVersion: _getVersion,
            getTicket: _getVersionTicket,
            getDownloadHref: _getHref
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

        function _survey(surveyId) {
            return _api().one(surveyId + '');
        }

        function _surveys() {
            return _api().get().then(_plainResp);
        }

        function _getSurvey(surveyId, params) {
            return _survey(surveyId).get(params).then(_plainResp);
        }

        function _addSurvey(survey, params) {
            return _api().customPOST(survey, null, params).then(_plainResp);
        }

        function _deleteSurvey(survey) {
            return _survey(survey.id).remove().then(_plainResp);
        }

        function _updateSurvey(survey, params) {
            return _survey(survey.id).customPUT(survey, null, params).then(_plainResp);
        }

        function _listVersions(surveyId) {
            return _survey(surveyId).one('versions').get().then(_plainResp);
        }

        function _getVersion(surveyId, versionId) {
            return _survey(surveyId).one('versions', versionId + '').get().then(_plainResp);
        }

        function _getVersionTicket(survey) {
            return 'direct';
        }

        function _getHref(survey) {
            return greyscaleUtilsSrv.getApiBase() + '/surveys/' + survey.id + '/savedocx/' + survey.surveyVersion;
        }
    });
