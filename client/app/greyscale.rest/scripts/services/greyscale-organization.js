/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleOrganizationSrv', function (greyscaleRestSrv) {

        var _api= greyscaleRestSrv().one('organizations');

        return {
            list: _list,
            get: _get
        };

        function _list (param) {
            return _api.get(param);
        }

        function _get (id) {
            return _api.one(id).get();
        }
    });
