/**
 * Created by igi on 20.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersUoaCtrl', function ($scope, $q, _, greyscaleUoaApi, greyscaleUserApi, greyscaleProfileSrv,
        greyscaleUserUoaApi, $log) {
        $scope.model = {
            users: [],
            pubUoa: [],
            privUoa: [],
            selectedUsers: [],
            loading: true,
            hasChanges: false
        };

        var checks = {
            current: [],
            add: [],
            del: []
        };

        $scope.onUserSelect = onUserSelect;
        $scope.checkItem = onUoaCheck;

        greyscaleProfileSrv.getProfile()
            .then(function (profile) {
                var req = {
                    _users: greyscaleUserApi.list({
                        organizationId: profile.organizationId,
                        mock: 1
                    }),
                    _pubUoa: greyscaleUoaApi.list({
                        mock: 1,
                        visibility: 1,
                        status: '1',
                        fields: 'id,name,description,status'
                    }),
                    _privUoa: greyscaleUoaApi.list({
                        mock: 1,
                        visibility: 1,
                        status: '2',
                        ownerId: profile.id,
                        fields: 'id,name,description,status'
                    })
                };

                return $q.all(req).then(function (resp) {
                    $scope.model.users = resp._users;
                    $scope.model.pubUoa = resp._pubUoa;
                    $scope.model.privUoa = resp._privUoa;
                    checkUoas($scope.model.pubUoa);
                    checkUoas($scope.model.privUoa);
                });
            })
            .finally(function () {
                $scope.model.loading = false;
            });

        function checkUoas(uoas) {
            for (var u = 0; u < uoas.length; u++) {
                uoas[u].checked = _.includes(checks.current, uoas[u].id);
            }
        }

        function onUserSelect() {
            var queries = [];
            var l = $scope.model.selectedUsers.length;
            if (l > 0) {
                greyscaleUserUoaApi.list({
                    userId: $scope.model.selectedUsers.join('|'),
                    mock: 1
                }).then(function (data) {
                    checks.current = [];
                    checks.add = [];
                    checks.del = [];
                    var uoas = _.groupBy(data, 'uoaId');
                    for (var uoaId in uoas) {
                        if (uoas.hasOwnProperty(uoaId) && uoas[uoaId].length === l) {
                            checks.current.push(uoaId * 1);
                        }
                    }
                    checkUoas($scope.model.pubUoa);
                    checkUoas($scope.model.privUoa);

                });
            }
            /*
             for (var u = 0; u < $scope.model.selectedUsers.length; u++) {
             $log.debug($scope.model.selectedUsers[u]);
             queries.push(greyscaleUserApi.listUoa($scope.model.selectedUsers[u]));
             }

             $q.all(queries).then(function (resp) {

             for (var r = 0; r < resp.length; r++) {
             $log.debug(resp[r].plain());
             }
             });
             */
        }

        function onUoaCheck(item) {
            var wasChecked = _.includes(checks.current, item.id);
            if (wasChecked) {
                if (item.checked) {
                    checks.del = _.remove(checks.del, item.id);
                } else {
                    checks.del.push(item.id);
                }
            } else {
                if (!item.checked) {
                    checks.add = _.remove(checks.add, item.id);
                } else {
                    checks.add.push(item.id);
                }
            }
            $scope.model.hasChanges = (checks.add.length + checks.del.length + $scope.model.selectedUsers.length > 0);
        }

    });
