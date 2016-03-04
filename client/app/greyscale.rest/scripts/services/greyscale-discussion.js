/**
 * Created by igi on 25.02.16.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleDiscussionApi', function (greyscaleRestSrv) {
        return {
            list: _list,
            scopeList: _scope,
            get: _get,
            add: _add,
            update: _update,
            remove: _remove,
            getUsers: _users
        };

        function _api() {
            return greyscaleRestSrv().one('discussions');
        }

        function _response(data) {
            return data.plain();
        }

        function _list(params) {
            return _api().get(params).then(_response);
        }

        function _scope(params) {
            return _api().one('entryscope').get(params).then(_response);
        }

        function _get(id) {
            return _api().one('entryscope', id + '').get().then(_response);
        }

        function _add(data) {
            return _api().customPOST(data);
        }

        function _update(id, data) {
            return _api().one(id + '').customPUT(data);
        }

        function _remove(id) {
            return _api().one(id + '').remove();
        }

        function _users(taskId) {
            return _api().one('users', taskId + '').get().then(_response);
        }
    });
