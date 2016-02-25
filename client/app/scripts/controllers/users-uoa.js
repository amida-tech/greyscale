/**
 * Created by igi on 20.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersUoaCtrl', function ($scope, $q, greyscaleUoaApi, greyscaleUserApi, greyscaleProfileSrv,
        greyscaleUserUoaApi, greyscaleUtilsSrv) {
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
        $scope.applyChanges = apply;

        greyscaleProfileSrv.getProfile()
            .then(function (profile) {
                var req = {
                    _users: greyscaleUserApi.list({
                        organizationId: profile.organizationId
                    }),
                    _pubUoa: greyscaleUoaApi.list({
                        visibility: 1,
                        status: '1',
                        fields: 'id,name,description,status'
                    }),
                    _privUoa: greyscaleUoaApi.list({
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
                    checkUoas();
                });
            })
            .finally(function () {
                $scope.model.loading = false;
            });

        function checkUoas() {
            _check($scope.model.pubUoa);
            _check($scope.model.privUoa);

            function _check(uoas) {
                var u, l = uoas.length;
                for (u = 0; u < l; u += 1) {
                    uoas[u].checked = (checks.current.indexOf(uoas[u].id) > -1);
                }
            }
        }

        function onUserSelect() {
            var queries = [];
            var l = $scope.model.selectedUsers.length, u = 0;
            if (l > 0) {
                for (u = 0; u < l; u++) {
                    queries.push(greyscaleUserUoaApi.list($scope.model.selectedUsers[u]));
                }

                $q.all(queries).then(function (data) {
                    var uoas = {}, uoaId;
                    var d, dataLength = data.length;

                    for (d = 0; d < dataLength; d += 1) {
                        l = data[d].length;
                        for (u = 0; u < l; u += 1) {
                            uoaId = data[d][u].id;
                            if (uoas[uoaId]) {
                                uoas[uoaId] += 1;
                            } else {
                                uoas[uoaId] = 1;
                            }
                        }
                    }
                    checks.current = [];
                    checks.add = [];
                    checks.del = [];

                    for (uoaId in uoas) {
                        if (uoas.hasOwnProperty(uoaId) && uoas[uoaId] === dataLength) {
                            checks.current.push(uoaId * 1);
                        }
                    }
                    checkUoas();
                });
            }
        }

        function isChanged() {
            $scope.model.hasChanges = (checks.add.length + checks.del.length > 0 && $scope.model.selectedUsers.length > 0);
        }

        function onUoaCheck(item) {
            var wasChecked = (checks.current.indexOf(item.id) > -1);
            if (wasChecked) {
                if (item.checked) {
                    checks.del = checks.del.splice(checks.del.indexOf(item.id), 1);
                } else {
                    checks.del.push(item.id);
                }
            } else {
                if (!item.checked) {
                    checks.add = checks.add.splice(checks.add.indexOf(item.id), 1);
                } else {
                    checks.add.push(item.id);
                }
            }
            isChanged();
        }

        function apply() {
            var reqs = [];
            var u, uCount = $scope.model.selectedUsers.length;
            if (uCount > 0) {
                for (u = 0; u < uCount; u += 1) {
                    if (checks.add.length > 0) {
                        reqs.push(greyscaleUserUoaApi.add($scope.model.selectedUsers[u], checks.add));
                    }
                    if (checks.del.length > 0) {
                        reqs.push(greyscaleUserUoaApi.del($scope.model.selectedUsers[u], checks.del));
                    }
                }

                $q.all(reqs)
                    .then(function () {
                        checks.add = [];
                        checks.del = [];
                        isChanged();
                    })
                    .catch(greyscaleUtilsSrv.errorMsg);
            }
        }
    });
