/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleUtilsSrv', function (_, greyscaleGlobals, greyscaleRolesSrv, $log, inform) {

        return {
            decode: _decode,
            removeInternal: _purify,
            prepareFields: _preProcess,
            errorMsg: addErrMsg,
            getRoleMask: _getRoleMask,
            parseURL: _parseURL
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
            var msg = prefix ? prefix + ': ' : '';
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

        function _getRoleMask(roleId, withDefault) {
            withDefault = !!withDefault;

            var res = _.get(_.find(greyscaleGlobals.userRoles, {
                id: roleId
            }), 'mask');

            if (withDefault) {
                res = res || greyscaleGlobals.userRoles.nobody.mask;
            }
            return res;
        }

        function _parseURL(url) {
            var p = document.createElement('a');
            p.href = url;
            var result = {
                protocol: p.protocol,
                hostname: p.hostname,
                port: p.port,
                path: p.pathname,
                search: decodeURIComponent(p.search),
                hash: p.hash,
                params: {}
            };

            if (result.search) {
                var params = result.search.substring(1).split('&');

                for (var i = 0; i < params.length; i++) {
                    var parts = params[i].split('=');

                    if (parts[0]) {
                        var param = result.params[parts[0]];

                        if (typeof param === 'undefined') {
                            param = parts[1];
                        } else if (angular.isArray(param)) {
                            param.push(parts[1]);
                        } else {
                            param = [param, parts[1]];
                        }

                        result.params[parts[0]] = param;
                    }
                }
            }
            return result;
        }
    });
