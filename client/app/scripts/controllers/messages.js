'use strict';

angular.module('greyscaleApp')
    .controller('MessagesCtrl', function (_, $q, $sce, $scope, greyscaleProfileSrv, greyscaleUserApi,
        greyscaleModalsSrv, greyscaleNotificationApi, greyscaleGlobals, Organization) {

        $scope.model = {};

        var _realm;

        greyscaleProfileSrv.getProfile()
            .then(_setRealm)
            .then(_loadData)
            .then(_normalizeData)
            .then(_parseConversations)
            .then(function (data) {
                $scope.model.conversations = data.conversations;
            });

        $scope.setCurrent = function (conversation) {
            $scope.model.currentConv = conversation;
        };

        $scope.isActive = function (conv) {
            return $scope.model.currentConv && (conv.userId === $scope.model.currentConv.userId);
        };

        $scope.unreadCount = function (conv) {
            var unread = _.filter(conv.messages, {
                read: false
            }).length;
            if (unread) {
                return unread;
            }
        };

        function _setRealm(profile) {
            _realm = greyscaleProfileSrv.isSuperAdmin() ? greyscaleGlobals.adminSchema : Organization.realm;
            return profile;
        }

        function _normalizeData(data) {
            var allMessages = [];
            angular.forEach(data.income, function (msg) {
                msg.income = true;
                msg.userId = msg.userFrom;
                msg.userFullName = msg.userFromName;
                allMessages.push(msg);
            });
            angular.forEach(data.outcome, function (msg) {
                msg.outcome = true;
                msg.userId = msg.userTo;
                msg.userFullName = msg.userToName;
                allMessages.push(msg);
            });
            data.allMessages = _.sortBy(allMessages, 'created').reverse();
            return data;
        }

        function _parseConversations(data) {
            var conversations = [];
            var groups = _.groupBy(data.allMessages, 'userId');
            angular.forEach(groups, function (group) {
                var item = group[0];
                var conversation = {
                    userId: item.userId,
                    userFullName: item.userFullName,
                    messages: group
                };
                conversations.push(conversation);
            });
            data.conversations = conversations;
            return data;
        }

        function _loadData(profile) {
            var req = {
                income: greyscaleNotificationApi.list({
                    userTo: profile.id
                }, _realm),
                outcome: greyscaleNotificationApi.list({
                    userFrom: profile.id
                }, _realm)
            };
            return $q.all(req);
        }

        $scope.sendMessage = function () {
            greyscaleModalsSrv.sendMessage();
        };

    });
