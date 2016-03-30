'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleGroupApi', function ($q, greyscaleRestSrv) {

        return {
            list: _list,
            add: _add,
            update: _update,
            delete: _delete
        };

        function _userGroupAPI() {
            return greyscaleRestSrv().one('groups');
        }

        function _list(params) {
            return _userGroupAPI().get(params)
                .catch(function(){
                    return [];
                });
        }

        function _add(group) {
            return _userGroupAPI().customPOST(group);
        }

        function _update(group) {
            return _userGroupAPI().one(group.id + '').customPUT(group);
        }

        function _delete(groupId) {
            return _userGroupAPI().one(groupId + '').remove();
        }

    });
