/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleUtilsSrv', function (_) {
        var _decode = function (dict, key, code, name) {
            var req = {};
            req[key] = code;
            var res = _.get(_.find(dict, req), name);
            if (!res) {
                res = code;
            }
            return res;
        };

        var _purify = function (cols, data) {
            var res = {};
            for (var c = 0; c < cols.length; c++) {
                if (data.hasOwnProperty(cols[c].field) && !cols[c].internal) {
                    res[cols[c].field] = data[cols[c].field];
                }
            }
            return res;
        };

        return {
            decode: _decode,
            removeInternal: _purify
        };
    });
