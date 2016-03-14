/**
 * Created by igi on 12.02.16.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleSurveyAnswerApi', function (greyscaleRestSrv) {

        return {
            list: _listItems,
            save: _saveItem,
            addAttach: _postAttach
        };

        function _api() {
            return greyscaleRestSrv().one('survey_answers');
        }

        function _postProcess(resp) {
            var res = resp;
            if (resp && typeof resp.plain === 'function') {
                res = resp.plain();
            }
            return res;
        }

        function _listItems(params) {
            return _api().get(params).then(_postProcess);
        }

        function _saveItem(answer, isAuto) {
            var param = {};
            if (isAuto) {
                param.autosave = isAuto;
            }
            return _api().customPOST(answer, '', param).then(_postProcess);
        }

        function _postAttach(attachId, body) {
            return _api().one(attachId + '', 'attach').customPOST(body).then(_postProcess);
        }
    });
