/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleUtilsSrv', function (greyscaleEnv, _, greyscaleGlobals, $log, inform,
        i18n, greyscaleRealmSrv, $translate, $window) {

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
            getUserName: _getUserName,
            getTagsAssociate: _getTagsAssociate,
            getTagsPostData: _getTagsPostData,
            getElemOffset: _getOffset,
            apiErrorMessage: _cmnErrHdlr
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

        function _addMsg(msg, prefix, type, extData) {
            var _msg = prefix ? i18n.translate(prefix, extData) + ': ' : '';
            var msgText = 'API_ERRORS.503';
            if (msg) {
                if (msg.data) {
                    if (msg.data.message) {
                        msgText = msg.data.message;
                    } else {
                        $log.warn('data w/o message', msg.data);
                        msgText = msg.data;
                    }
                } else if (typeof msg === 'string') {
                    msgText = _detectSystem(msg);
                } else if (msg.message) {
                    msgText = msg.message;
                } else if (msg.statusText) {
                    msgText = msg.statusText;
                }
                _msg += i18n.translate(msgText, extData);

                $log.debug('(' + type + ') ' + _msg);

                inform.add(_msg, {
                    type: type
                });

            }
        }

        function _detectSystem(msg) {
            if (msg.match(/^(<!doctype|<html)/i)) {
                return $translate.instant('API_ERRORS.503');
            }
            return msg;
        }

        function _errMsg(err, prefix, extData) {
            extData = extData || {};
            _addMsg(err, prefix, 'danger', extData);
        }

        function _successMsg(msg, prefix, extData) {
            extData = extData || {};
            _addMsg(msg, prefix, 'success', extData);
        }

        function _cmnErrHdlr(msg, action, entry) {
            _errMsg(msg, 'API_ACTIONS.' + action + '.ERR', {
                entry: i18n.translate(entry)
            });
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

        function _getTagsAssociate(tagsData) {
            var tag, i, qty, title;
            var _associate = {
                tags: []
            };
            qty = tagsData.users.length;
            for (i = 0; i < qty; i++) {
                tag = tagsData.users[i];
                title = _getUserName(tag);
                angular.extend(tag, {
                    fullName: title
                });
                _associate.tags.push(tag);
                _associate[tag.userId] = tag;

            }
            qty = tagsData.groups.length;
            for (i = 0; i < qty; i++) {
                _associate.tags.push(tagsData.groups[i]);
            }
            return _associate;
        }

        function _getTagsPostData(tags) {
            var _tagsData = {
                    users: [],
                    groups: []
                },
                i, qty;

            qty = tags ? tags.length : 0;

            for (i = 0; i < qty; i++) {
                if (tags[i].userId) {
                    _tagsData.users.push(tags[i].userId);
                } else if (tags[i].groupId) {
                    _tagsData.groups.push(tags[i].groupId);
                }
            }
            return _tagsData;
        }

        function _getOffset(elem) {
            if (elem.getBoundingClientRect) {
                return _getOffsetRect(elem);
            } else {
                return _getOffsetSum(elem);
            }
        }

        function _getOffsetSum(elem) {
            var top = 0,
                left = 0;

            while (elem) {
                top = top + parseInt(elem.offsetTop);
                left = left + parseInt(elem.offsetLeft);
                elem = elem.offsetParent;
            }

            return {
                top: top,
                left: left
            };
        }

        function _getOffsetRect(elem) {
            var box = elem.getBoundingClientRect(),
                body = $window.document.body,
                docElem = $window.document.documentElement;

            var scrollTop = $window.pageYOffset || docElem.scrollTop || body.scrollTop,
                scrollLeft = $window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
                clientTop = docElem.clientTop || body.clientTop || 0,
                clientLeft = docElem.clientLeft || body.clientLeft || 0;

            return {
                top: Math.round(box.top + scrollTop - clientTop),
                left: Math.round(box.left + scrollLeft - clientLeft)
            };
        }

    });
