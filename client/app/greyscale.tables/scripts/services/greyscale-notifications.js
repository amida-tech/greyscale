'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleNotificationsTbl', function ($q, _,
        greyscaleProfileSrv,
        greyscaleGroupApi,
        greyscaleNotificationApi,
        greyscaleModalsSrv, userNotificationsSrv, greyscaleGlobals, Organization) {

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
            title: tns + 'USER',
            field: 'userFromName',
            sortable: 'userFromName'
        }, {
            cellTemplate: '<span ng-if="row.toMe"><i class="fa fa-chevron-right"></i></span>' +
                '<span ng-if="row.fromMe"><i class="fa fa-chevron-left"></i></span>'
        }, {
            field: 'body',
            title: tns + 'MESSAGE',
            cellTemplate: '<div class="">{{cell}}</div>'
        }, {
            field: 'read',
            title: tns + 'READ',
            sortable: 'read',
            cellTemplate: '<div class="text-center">' +
                '<i class="fa" ng-class="{\'fa-eye\':row.read, \'fa-eye-slash\':!row.read}" title="{{\'' + tns + '\' + (row.read ? \'WAS_READ\' : \'WAS_NOT_READ\')|translate}}"></i>' +
                '&nbsp;<a ng-click="ext.toggleRead(row)" class="action" ><small ng-show="row.read" translate="' + tns + 'SET_UNREAD"></small><small ng-hide="row.read" translate="' + tns + 'SET_READ"></small></a>' +
                '</div>',
            cellTemplateExtData: {
                toggleRead: _toggleRead
            }
        }, {
            cellTemplate: '<div class="text-right"><a ng-if="row.toMe" class="action" ng-click="ext.reply(row)" title="{{\'' + tns + 'REPLY\'|translate}}"><i class="fa fa-reply"></i></a></div>',
            cellTemplateExtData: {
                reply: _reply
            }
        }];

        var _table = {
            title: tns + 'NOTIFICATIONS',
            cols: _cols,
            sorting: {
                created: 'desc'
            },
            dataPromise: _getData,
            dataFilter: {},
            //formTitle: tns + 'USER_GROUP',
            pageLength: 10,
            rowClass: function (row) {
                return !row.read ? 'bg-warning' : '';
            }
        };

        function _getData() {
            return greyscaleProfileSrv.getProfile()
                .then(_setRealm)
                .then(function (profile) {
                    var req = {
                        notifications: greyscaleNotificationApi.list({
                            userTo: profile.id
                        }, _realm)
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

        function _toggleRead(msg) {
            var method = msg.read ? 'setUnread' : 'setRead';
            greyscaleNotificationApi[method](msg.id, _realm)
                .then(function () {
                    msg.read = !msg.read;
                    userNotificationsSrv.update();
                });
        }

        function _reply(msg) {
            _toggleRead(msg);
            var toUser = {
                id: msg.userFrom,
                replyTo: msg.userFromName
            };
            greyscaleModalsSrv.sendMessage(toUser);
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
