/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleOrganizationSrv', function (greyscaleRestSrv) {
        var _api= greyscaleRestSrv().one('organizations');

        return {
            list: function() {
                return _api.get();
            },
            get: function(id) {
                return _api.one(id).get();
            }
        };
    });
