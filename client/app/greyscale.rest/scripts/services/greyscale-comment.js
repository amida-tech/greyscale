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
            autoSave: _autoSave,
            update: _update,
            remove: _remove,
            getUsers: _users,
            getAnswers: _getAnswers,
            postAnswer: _postAnswer,
            hide: _hide
        };

        function _api() {
            return greyscaleRestSrv().one('comments');
        }

        function _response(data) {
            var i, qty, _entry,
                _quote = /^<blockquote>(.*?)<\/blockquote>/i;

            if (data) {
                if (typeof data.plain === 'function') {
                    data = data.plain();
                }

                qty = data.length;

                for (i = 0; i < qty; i++) {
                    // fix range format
                    while (data[i].range && typeof data[i].range === 'string') {
                        data[i].range = JSON.parse(data[i].range);
                    }

                    // fix quoted text: move it to the range object
                    if (data[i].range && !data[i].range.entry) {
                        _entry = _quote.exec(data[i].entry);
                        if (_entry && _entry[1]) {
                            data[i].range.entry = _entry[1];
                            data[i].entry = data[i].entry.replace(_entry[0], '');
                        }
                    }
                }
            }
            return data;
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

        function _add(data, params) {
            return _api().customPOST(data, null, params).then(_response);
        }

        function _autoSave(data) {
            return _add(data, {
                autosave: true
            });
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

        function _hide(taskId, filter, show) {
            //filter values - 'all', 'flagged', commentId
            return _api().one('hidden').put({
                taskId: taskId,
                filter: filter,
                hide: !show
            });
        }
    });
