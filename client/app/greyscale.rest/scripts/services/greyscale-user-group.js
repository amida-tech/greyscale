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
                        name: 'Employees/Staff',
                        description: 'Those who works'
                    }, {
                        id: 2,
                        name: 'Contractors',
                        description: 'Those who deals'
                    }, {
                        id: 3,
                        name: 'Researchers',
                        description: 'Those who looks'
                    }, {
                        id: 4,
                        name: 'Translators',
                        description: 'Those who knows'
                    }, {
                        id: 5,
                        name: 'Management',
                        description: 'Those who asks'
                    }, {
                        id: 6,
                        name: 'Support',
                        description: 'Those who serves'
                    }, {
                        id: 7,
                        name: 'Government Employees',
                        description: 'Those who works too'
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
