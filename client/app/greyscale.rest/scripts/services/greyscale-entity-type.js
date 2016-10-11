/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleEntityTypeApi', function (greyscaleRestSrv, $q) {

        return {
            list: _list,
            add: _add,
            get: _get,
            getByFile: _getByFileName
        };

        function _postProcess(resp) {
            if (typeof resp.plain === 'function') {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function _api() {
            return greyscaleRestSrv.api().one('essences');
        }

        function _list(params) {
            return _api().get(params).then(_postProcess);
        }

        function _get(id) {
            return _list({
                id: id
            });
        }

        function _add(data) {
            return _api().customPOST(data);
        }

        function _getByFileName(fileName) {
            if (fileName) {
                return _list({
                        fileName: fileName
                    })
                    .then(function (list) {
                        var l, qty = list.length;
                        for (l = 0; l < qty; l++) {
                            if (list[l].fileName === fileName) {
                                return list[l];
                            }
                        }
                        return $q.reject('essence "' + fileName + '" undefined');
                    });
            } else {
                $q.reject('Essence filename is undefined');
            }
        }
    });
