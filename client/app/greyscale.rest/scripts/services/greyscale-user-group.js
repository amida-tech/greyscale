'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUserGroupApi', function ($q, greyscaleRestSrv) {

        return {
            list: _list,
            add: _add,
            update: _update,
            del: _del
        };

        function _userGroupAPI() {
            return greyscaleRestSrv().one('usergroups');
        }

        function _list(params) {
            return _userGroupAPI().get(params)
                .catch(function () {
                    return $q.when([{
                        id: 1,
                        name: 'ddddddddd',
                        description: 'ffffffffffffffffff'
                    }]);
                });
        }

        function _add(group) {
            return _userGroupAPI().customPOST(group);
        }

        function _update(group) {
            return _userGroupAPI().one(group.id + '').customPUT(group);
        }

        function _del(groupId) {
            return _userGroupAPI().one(groupId + '').remove();
        }

    });
