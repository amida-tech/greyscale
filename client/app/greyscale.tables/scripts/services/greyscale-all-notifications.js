'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleAllNotificationsTbl', function ($q, _, $sce, greyscaleProfileSrv, greyscaleGroupApi,
        greyscaleNotificationApi, greyscaleModalsSrv, userNotificationsSrv, greyscaleGlobals, Organization) {

        var tns = 'NOTIFICATIONS.';

        var _dicts = {};

        var _extModel = {};

        var _realm;

        var _cols = [{
            field: 'created',
            title: tns + 'DATE_TIME',
            cellTemplate: '<small>{{cell|date:\'medium\'}}</small>',
            sortable: 'created'
        }, {
            title: tns + 'USER_FROM',
            field: 'userFromName',
            sortable: 'userFromName'
        }, {
            title: tns + 'USER_TO',
            field: 'userToName',
            sortable: 'userToName'
        }, {
            cellTemplate: '<span ng-if="row.toMe"><i class="fa fa-chevron-right"></i></span>' +
                '<span ng-if="row.fromMe"><i class="fa fa-chevron-left"></i></span>'
        }, {
            field: 'body',
            title: tns + 'MESSAGE',
            cellTemplate: '<p><b>{{row.subject}}</b><br><span ng-bind-html="ext.sanitize(row.note)"></span></p>',
            cellTemplateExtData: {
                sanitize: $sce.trustAsHtml
            }
        }];

        var _table = {
            title: tns + 'ALL_NOTIFICATIONS',
            cols: _cols,
            sorting: {
                created: 'desc'
            },
            dataPromise: _getData,
            dataFilter: {},
            //formTitle: tns + 'USER_GROUP',
            pageLength: 50
        };

        function _getData() {
            return greyscaleProfileSrv.getProfile()
                .then(_setRealm)
                .then(function (profile) {
                    var req = {
                        notifications: greyscaleNotificationApi.list({}, _realm)
                    };
                    return $q.all(req).then(function (promises) {
                        return promises.notifications;
                    });
                });
        }

        function _setRealm(profile) {
            _realm = greyscaleProfileSrv.isSuperAdmin() ? greyscaleGlobals.adminSchema : Organization.realm;
            return profile;
        }

        function _reload() {
            _table.tableParams.reload();
        }

        function _errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            //greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
