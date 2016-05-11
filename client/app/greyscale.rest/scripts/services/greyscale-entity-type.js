/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleEntityTypeApi', function (greyscaleRestSrv) {

        return {
            list: _list,
            add: _add,
            get: _get
        };

        function _postProcess(resp) {
            if (typeof resp.plain === 'function') {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function _api() {
            return greyscaleRestSrv().one('essences');
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
    });
