angular.module('greyscaleApp')
    .service('userNotificationsSrv', function () {
        var update;
        return {
            setUpdate: function (method) {
                update = method;
            },
            update: function () {
                if (typeof update === 'function') {
                    update();
                }
            }
        };
    })
    .directive('userNotifications', function (_, greyscaleProfileSrv, greyscaleNotificationApi, Organization,
        greyscaleWebSocketSrv, userNotificationsSrv, greyscaleGlobals, greyscaleRealmSrv, $sce) {
        var wsEvents = greyscaleGlobals.events.ws;

        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'views/directives/user-notifications.html',
            scope: true,
            link: function (scope) {
                scope.model = {
                    notifications: []
                };

                scope.sanitize = $sce.trustAsHtml;

                var user = {};

                scope.$on('$destroy', _stopNotifyUpdate);

                scope.markAsRead = function (notification, index) {
                    greyscaleNotificationApi.setRead(notification.id)
                        .then(function () {
                            scope.model.notifications.splice(index, 1);
                        });
                };

                _startNotifyUpdate();

                function _startNotifyUpdate() {
                    greyscaleProfileSrv.getProfile()
                        .then(function (profile) {
                            user = profile;
                            greyscaleWebSocketSrv.on(wsEvents.notify, _getUnreadNotifications);
                            userNotificationsSrv.setUpdate(_getUnreadNotifications);
                            _getUnreadNotifications();
                        });
                }

                function _stopNotifyUpdate() {
                    user = {};
                    greyscaleWebSocketSrv.off(wsEvents.notify, _getUnreadNotifications);
                    userNotificationsSrv.setUpdate(null);
                }

                scope.markAllAsRead = function () {
                    greyscaleNotificationApi.setAllRead()
                        .then(function () {
                            scope.model.notifications.splice(0);
                        });
                };

                function _getUnreadNotifications() {
                    if (user.id) {
                        greyscaleNotificationApi.list({
                                userTo: user.id,
                                read: false
                            })
                            .then(function (notifications) {
                                scope.model.notifications = _.sortBy(notifications, 'created').reverse();
                            });
                    }
                }
            }
        };
    });
