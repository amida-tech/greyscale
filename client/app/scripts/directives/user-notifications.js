angular.module('greyscaleApp')
    .directive('userNotifications', function (_, greyscaleProfileSrv, greyscaleNotificationApi, $timeout) {
        return {
            restrict: 'A',
            replace: true,
            template: '<div class="user-notifications dropdown">' +
                '   <i ng-show="!model.notifications.length"class="disabled fa fa-bell-o"></i>' +
                '   <a ng-if="model.notifications.length" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-bell"></i><span class="counter">{{model.notifications.length}}</span></a>' +
                '   <ul ng-if="model.notifications.length" class="dropdown-menu dropdown-menu-right">' +
                '       <li class="notification" ng-repeat="notification in model.notifications track by $index">' +
                '           <div class="sender">{{notification.userFromName}}</div>' +
                '           <div class="send-time">{{notification.created|date:\'medium\'}}</div>' +
                '           <p>{{notification.body}}</p>' +
                '           <div class="control pull-right"><a ng-click="markAsRead(notification, $index); $event.stopPropagation()" translate="NOTIFICATIONS.MARK_AS_READ"></a></div>' +
                '       <div class="clearfix"></div>' +
                '       </li>' +
                '   </ul>' +
                '</div>',
            scope: true,
            link: function (scope) {
                scope.model = {
                    notifications: []
                };

                var user, off = function () {};

                greyscaleProfileSrv.getProfile()
                    .then(function (profile) {
                        user = profile;
                        _getUnreadNotifications();
                    });

                scope.$on('$destroy', function () {
                    $timeout.cancel(off);
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
                            off = $timeout(function () {
                                _getUnreadNotifications();
                            }, 10000);
                        });
                }

            }
        };
    });
