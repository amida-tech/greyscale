/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleOrganizationSrv', function (greyscaleRestSrv) {

        return {
            list: _list,
            get: _get
        };

        function api(){
            return greyscaleRestSrv().one('organizations');
        }

        function _list (param) {
            return api().get(param);
        }

        function _get (id) {
            return api().one(id).get();
        }
    });
