/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleProjectSrv', function (greyscaleRestSrv) {
        var _api = greyscaleRestSrv().one('projects');

        return {
            list: function() {
                return _api.get();
            },
            add: function(project) {
                return _api.customPOST(project);
            }
        };
    });
