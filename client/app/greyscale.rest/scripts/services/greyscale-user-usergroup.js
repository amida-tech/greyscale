'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUserUserGroupApi', function ($q, greyscaleRestSrv) {

        return {
            list: _list,
            add: _add,
            update: _update,
            del: _del
        };

        function _userUserGroupAPI() {
            return greyscaleRestSrv().one('user_usergroups');
        }

        function _list(params) {
            return _userUserGroupAPI().get(params)
                .catch(function () {
                    return $q.when([{
                        id: 1,
                        userId: 245,
                        usergroupId: 1
                    }, {
                        id: 2,
                        userId: 245,
                        usergroupId: 2
                    }, {
                        id: 3,
                        userId: 216,
                        usergroupId: 3
                    }, {
                        id: 4,
                        userId: 172,
                        usergroupId: 4
                    }]);
                });
        }

        function _add(group) {
            return _userUserGroupAPI().customPOST(group);
        }

        function _update(group) {
            return _userUserGroupAPI().one(group.id + '').customPUT(group);
        }

        function _del(groupId) {
            return _userUserGroupAPI().one(groupId + '').remove();
        }

    });
