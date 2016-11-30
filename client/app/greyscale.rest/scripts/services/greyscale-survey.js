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
            versionUsers: _getVersionUsers,
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
            return greyscaleRestSrv.api().one('surveys');
        }

        function _survey(surveyId) {
            return _api().one(surveyId + '');
        }

        function _surveyVersion(surveyId, version) {
            var _sv = _survey(surveyId).one('versions');

            if (typeof version !== 'undefined') {
                _sv = _sv.one(version + '');
            }
            return _sv;
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
            return _surveyVersion(surveyId).get().then(_plainResp);
        }

        function _getVersion(surveyId, version) {
            return _surveyVersion(surveyId, version).get().then(_plainResp);
        }

        function _getVersionTicket(survey) {
            return 'direct';
        }

        function _getHref(survey) {
            if(survey['isFinal'])
                return greyscaleUtilsSrv.getApiBase() + '/surveys/' + survey.id + '/savedocx/' + survey.surveyVersion + '/final';
            else
                return greyscaleUtilsSrv.getApiBase() + '/surveys/' + survey.id + '/savedocx/' + survey.surveyVersion;
        }

        function _getVersionUsers(surveyId, version, params) {
            return _surveyVersion(surveyId, version).one('users').get(params).then(_plainResp);
        }
    });
