/**
 * Created by igi on 12.02.16.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleSurveyAnswerApi', function (greyscaleRestSrv) {

        return {
            list: _listAnswers,
            save: _saveItem,
            addAttach: _postAttach,
            update: _update
        };

        function _api() {
            return greyscaleRestSrv.api().one('survey_answers');
        }

        function _processResp(resp) {
            var res = resp;
            if (resp && typeof resp.plain === 'function') {
                res = resp.plain();
            }
            return res;
        }

        function _listAnswers(productId, uoaId, params) {
            var _params = angular.extend({
                order: 'version'
            }, params);
            return _api().one(productId + '', uoaId + '').get(_params).then(_processResp);
        }

        function _saveItem(answer, isAuto) {
            var param = {};
            if (isAuto) {
                param.autosave = isAuto;
            }
            return _api().customPOST(answer, '', param).then(_processResp);
        }

        function _postAttach(attachId, body) {
            return _api().one(attachId + '', 'attach').customPOST(body).then(_processResp);
        }

        function _update(answerId, body) {
            return _api().one(answerId + '').customPUT(body).then(_processResp);
        }
    });
