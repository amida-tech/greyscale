/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleUtilsSrv', function (_, $log, inform) {

        return {
            decode: _decode,
            removeInternal: _purify,
            prepareFields: _preProcess,
            errorMsg: addErrMsg
        };

        function _decode(dict, key, code, name) {
            var req = {};
            req[key] = code;
            var res = _.get(_.find(dict, req), name);
            if (!res) {
                res = code;
            }
            return res;
        }

        function _purify(cols, data) {
            var res = {};
            for (var c = 0; c < cols.length; c++) {
                if (data.hasOwnProperty(cols[c].field) && !cols[c].internal) {
                    res[cols[c].field] = data[cols[c].field];
                }
            }
            return res;
        }

        function _preProcess(dataSet, fields) {
            for (var p = 0; p < dataSet.length; p++) {
                var dataRec = dataSet[p];
                for (var f = 0; f < fields.length; f++) {
                    if (fields[f].dataFormat === 'date' && dataRec[fields[f].field]) {
                        dataRec[fields[f].field] = new Date(dataRec[fields[f].field]);
                    }
                }
            }
        }

        function addErrMsg(err, prefix) {
            var msg = prefix + ': ' || '';
            if (err) {
                if (err.data) {
                    if (err.data.message) {
                        msg += err.data.message;
                    } else {
                        msg += err.data;
                    }
                } else {
                    msg += err;
                }
                $log.debug(msg);
                inform.add(msg, {
                    type: 'danger'
                });
            }
        }

    });
