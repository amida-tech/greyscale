/**
 * Created by igi on 27.05.16.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleCommentApi', function (_, greyscaleRestSrv) {
        return {
            list: _list,
            scopeList: _scope,
            get: _get,
            add: _add,
            update: _update,
            remove: _remove,
            getUsers: _users,
            getAnswers: _getAnswers,
            postAnswer: _postAnswer
        };

        function _api() {
            return greyscaleRestSrv().one('comments');
        }

        function _response(data) {
            if (data && typeof data.plain === 'function') {
                return data.plain();
            } else {
                return data;
            }
        }

        function _list(params) {
            params = angular.extend({
                order: '-created,-updated'
            }, params);
            return _api().get(params).then(_response);
        }

        function _scope(params) {
            return _api().one('entryscope').get(params).then(_response);
        }

        function _get(id) {
            return _api().one('entryscope', id + '').get().then(_response);
        }

        function _add(data) {
            return _api().customPOST(data).then(_response);
        }

        function _update(id, data) {
            return _api().one(id + '').customPUT(data).then(_response);
        }

        function _remove(id) {
            return _api().one(id + '').remove().then(_response);
        }

        function _users(taskId) {
            return _api().one('users', taskId + '').get().then(_response);
        }

        function _getAnswers(commentId) {
            return _api().one(commentId + '').one('answers').get().then(_response);
        }

        function _postAnswer(commentId, answer) {
            return _api().one(commentId + '').one('answers').customPOST(answer).then(_response);
        }
    });
