'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleMessagesTbl', function ($q, _,
        greyscaleProfileSrv,
        greyscaleGroupApi,
        greyscaleNotificationApi,
        greyscaleModalsSrv, Organization) {

        var tns = 'MESSAGES.';

        var _dicts = {};

        var _extModel = {};

        var _cols = [{
            field: 'created',
            title: tns + 'DATE_TIME',
            cellTemplate: '<small>{{cell|date:\'medium\'}}</small>',
            sortable: 'created'
        }, {
            title: tns + 'USER',
            titleTemplate: '<select class="form-control" ng-change="ext.update()" ng-model="ext.model.filterUser" ng-options="user as user.fullName for user in ext.model.users"></select>',
            titleTemplateExtData: {
                //getUsers: _getConversationUsers,
                getUserName: _getUserName,
                model: _extModel,
                update: _reload
            },
            cellTemplate: '<span ng-if="row.toMe">{{row.userFromName}}</span>' +
                '<span ng-if="row.fromMe">{{row.userToName}}</span>'
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
                '{{\'COMMON.\' + (row.read ? \'YES\' : \'NO\')|translate}}' +
                '<a ng-if="row.toMe"  ng-click="ext.toggleRead(row)" class="action" title="{{\'' + tns + '\' + (!row.read ? \'SET_READ\' : \'SET_UNREAD\')|translate}}">&nbsp;<i ng-show="row.read" class="fa fa-eye-slash"></i><i ng-hide="row.read" class="fa fa-eye"></i></a>' +
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
            title: tns + 'MY_MESSAGES',
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
            },
            add: {
                icon: 'fa-envelope',
                title: tns + 'SEND_NEW_MESSAGE',
                handler: _newMessage
            }
        };

        function _getData() {
            return greyscaleProfileSrv.getProfile()
                .then(function (profile) {
                    var req = {
                        income: greyscaleNotificationApi.list({
                            userTo: profile.id
                        }),
                        outcome: greyscaleNotificationApi.list({
                            userFrom: profile.id
                        })
                    };
                    return $q.all(req).then(function (promises) {
                        var allMessages = [];
                        angular.forEach(promises.income, function (msg) {
                            msg.toMe = true;
                            allMessages.push(msg);
                        });
                        angular.forEach(promises.outcome, function (msg) {
                            msg.fromMe = true;
                            allMessages.push(msg);
                        });
                        _dicts.allMessages = allMessages;
                        _getConversationUsers();
                        return _filterByUser(allMessages);
                    });
                });
        }

        function _getUserName(msg) {

        }

        function _getConversationUsers() {
            var users = [];
            angular.forEach(_dicts.allMessages, function (msg) {
                var user;
                if (msg.toMe) {
                    user = {
                        id: msg.userFrom,
                        fullName: msg.userFromName
                    };
                } else {
                    user = {
                        id: msg.userTo,
                        fullName: msg.userToName
                    };
                }
                if (!_.find(users, {
                        id: user.id
                    })) {
                    users.push(user);
                }
            });
            _extModel.users = users;
            if (!_extModel.filterUser) {
                _extModel.filterUser = users[0];
            }
        }

        function _filterByUser(messages) {
            if (_extModel.filterUser) {
                return _.filter(messages, function (msg) {
                    return (msg.toMe && msg.userFrom === _extModel.filterUser.id) || (msg.fromMe && msg.userTo === _extModel.filterUser.id);
                });
            }
            return [];
        }

        function _toggleRead(msg) {
            var method = msg.read ? 'setUnread' : 'setRead';
            greyscaleNotificationApi[method](msg.id)
                .then(function () {
                    msg.read = !msg.read;
                });
        }

        function _newMessage(user) {
            greyscaleModalsSrv.sendMessage(user);
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
