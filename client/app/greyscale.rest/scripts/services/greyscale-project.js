/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleProjectSrv', function (greyscaleRestSrv) {
        var _api = greyscaleRestSrv().one('projects');

        function _list() {
            return _api.get();
        }

        function _add(project) {
            return _api.customPOST(project);
        }

        function _upd(project) {
            return _api.one(project.id + '').customPUT(project);
        }

        function _del(projectId) {
            return _api.one(projectId + '').remove();
        }

        return {
            list: _list,
            add: _add,
            update: _upd,
            delete: _del
        };
    });
