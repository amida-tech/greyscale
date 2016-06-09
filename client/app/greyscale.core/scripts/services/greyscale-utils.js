/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleUtilsSrv', function (greyscaleEnv, _, greyscaleGlobals, $log, inform,
        i18n, greyscaleRealmSrv, $translate) {

        return {
            decode: _decode,
            removeInternal: _purify,
            prepareFields: _preProcess,
            errorMsg: _errMsg,
            successMsg: _successMsg,
            getRoleMask: _getRoleMask,
            parseURL: _parseURL,
            getApiBase: _getApiBase,
            capitalize: _capitalize,
            countWords: _countWords,
            getUserName: _getUserName
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

        function _addMsg(msg, prefix, type) {
            var _msg = prefix ? i18n.translate(prefix) + ': ' : '';
            var msgText = '';
            if (msg) {
                if (msg.data) {
                    if (msg.data.message) {
                        msgText = msg.data.message;
                    } else {
                        msgText = msg.data;
                    }
                } else if (typeof msg === 'string') {
                    msgText = _detectSystem(msg);
                } else if (msg.message) {
                    msgText = msg.message;
                } else if (msg.statusText) {
                    msgText = msg.statusText;
                }
                _msg += i18n.translate(msgText);

                $log.debug('(' + type + ') ' + _msg);

                inform.add(_msg, {
                    type: type
                });

            }
        }

        function _detectSystem(msg) {
            if (msg.match(/^(<!doctype|<html)/i)) {
                return $translate.instant('COMMON.SERVICE_UNAVAILABLE');
            }
            return msg;
        }

        function _errMsg(err, prefix) {
            _addMsg(err, prefix, 'danger');
        }

        function _successMsg(msg, prefix) {
            _addMsg(msg, prefix, 'success');
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

        function _getApiBase(query) {
            var _realm = greyscaleRealmSrv.current();
            var host = [greyscaleEnv.apiHostname, greyscaleEnv.apiPort].join(':');
            var path = [_realm, greyscaleEnv.apiVersion].join('/');

            return (greyscaleEnv.apiProtocol || 'http') + '://' + host + '/' + path + (query ? '/' + query : '');
        }

        function _capitalize(_str) {
            return _str.charAt(0).toUpperCase() + _str.substr(1).toLowerCase();
        }

        function _countWords(str) {
            return (str ? str.split(/\s+/).length : 0);
        }

        function _getUserName(profile) {
            return [profile.firstName, profile.lastName].join(' ');
        }
    });
