angular.module('greyscaleApp')
    .directive('userNotifications', function (_, greyscaleProfileSrv, greyscaleNotificationApi) {
        return {
            restrict: 'A',
            replace: true,
            template: '<div class="user-notifications dropdown" translate-namespace="NOTIFICATIONS">' +
                '   <a class="dropdown-toggle" data-toggle="dropdown">' +
                '       <i class="fa fa-bell-o" ng-class="{disabled:!model.notifications.length}"></i>' +
                '       <span ng-if="model.notifications.length" class="counter">{{model.notifications.length}}</span>' +
                '   </a>' +
                '   <ul class="dropdown-menu dropdown-menu-right">' +
                '       <li ng-if="!model.notifications.length" class="notification">' +
                '           <p translate=".NO_UNREAD"></p>' +
                '           <div class="control pull-right"><a ui-sref="notifications" translate=".GO_HISTORY"></a></div>' +
                '           <div class="clearfix"></div>' +
                '       </li>' +
                '       <li class="notification" ng-repeat="notification in model.notifications track by $index">' +
                '           <div class="sender">{{notification.userFromName}}</div>' +
                '           <div class="send-time">{{notification.created|date:\'medium\'}}</div>' +
                '           <p>{{notification.body}}</p>' +
                '           <div class="control pull-right"><a ng-click="markAsRead(notification, $index); $event.stopPropagation()" translate=".MARK_AS_READ"></a></div>' +
                '           <div class="clearfix"></div>' +
                '       </li>' +
                '   </ul>' +
                '</div>',
            scope: true,
            link: function (scope) {
                scope.model = {
                    notifications: []
                };

                var user = function () {};

                greyscaleProfileSrv.getProfile()
                    .then(function (profile) {
                        user = profile;
                        _getUnreadNotifications();
                        scope.$on('something-new', _getUnreadNotifications);
                    });

                scope.markAsRead = function (notification, index) {
                    greyscaleNotificationApi.setRead(notification.id)
                        .then(function () {
                            scope.model.notifications.splice(index, 1);
                        });
                };

                function _getUnreadNotifications() {
                    greyscaleNotificationApi.list({
                            userTo: user.id,
                            read: false
                        })
                        .then(function (notifications) {
                            scope.model.notifications = _.sortBy(notifications, 'created').reverse();
                        });
                }

            }
        };
    });
