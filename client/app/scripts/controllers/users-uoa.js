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
            loading: true
        };

        $scope.onUserSelect = onUserSelect;

        greyscaleUserUoaApi.list({
            userId: 125
        });

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
                    uncheckUoas($scope.model.pubUoa);
                    uncheckUoas($scope.model.privUoa);
                });
            })
            .finally(function () {
                $scope.model.loading = false;
            });

        function uncheckUoas(_aUoa) {
            for (var u = 0; u < _aUoa.length; u++) {
                _aUoa[u].checked = false;
            }
        }

        function onUserSelect() {
            var queries = [];
            for (var u = 0; u < $scope.model.selectedUsers.length; u++) {
                $log.debug($scope.model.selectedUsers[u]);
                queries.push(greyscaleUserApi.listUoa($scope.model.selectedUsers[u]));
            }

            $q.all(queries).then(function (resp) {

                for (var r = 0; r < resp.length; r++) {
                    $log.debug(resp[r].plain());
                }
            });
        }

    });
