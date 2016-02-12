/**
 * Created by igi on 12.02.16.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleSurveyAnswerApi', function (greyscaleRestSrv) {
        return {
            list: _listItems,
            save: _saveItem
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

        function _saveItem(answer) {
            return _api().customPOST(answer).then(_postProcess);
        }
    });
