/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleProjectSrv', function (greyscaleRestSrv) {
        function api() {
            return greyscaleRestSrv().one('projects');
        }

        function _list(params) {
            return api().get(params);
        }

        function _get(id, params) {
            return api().one(id + '').get(params);
        }

        function _add(project) {
            return api().customPOST(project);
        }

        function _upd(project) {
            return api().one(project.id + '').customPUT(project);
        }

        function _del(projectId) {
            return api().one(projectId + '').remove();
        }

        return {
            list: _list,
            get: _get,
            add: _add,
            update: _upd,
            delete: _del
        };
    });
