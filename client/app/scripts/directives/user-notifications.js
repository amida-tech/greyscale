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
            template: '<div class="user-notifications dropdown" translate-namespace="NOTIFICATIONS">' +
                '   <a class="dropdown-toggle" data-toggle="dropdown">' +
                '       <i class="fa fa-bell-o" ng-class="{disabled:!model.notifications.length}"></i>' +
                '       <span ng-if="model.notifications.length" class="counter">{{model.notifications.length}}</span>' +
                '   </a>' +
                '   <ul class="dropdown-menu dropdown-menu-right">' +
                '       <li>' +
                '           <div class="scroll">' +
                '               <div>' +
                '                   <div class="notification" ng-repeat="notification in model.notifications track by $index">' +
                '                       <div class="sender">{{notification.userFromName}}</div>' +
                '                       <div class="send-time">{{notification.created|date:\'medium\'}}</div>' +
                '                       <p><b>{{notification.subject}}</b><br><span ng-bind-html="sanitize(notification.note)"></span></p>' +
                '                       <div class="control pull-right"><a ng-click="markAsRead(notification, $index); $event.stopPropagation()" translate=".MARK_AS_READ"></a></div>' +
                '                       <div class="clearfix"></div>' +
                '                   </div>' +
                '               </div>' +
                '               <div ng-if="!model.notifications.length" class="notification first">' +
                '                   <p translate=".NO_UNREAD"></p>' +
                '               </div>' +
                '           </div>' +
                '           <div class="go-history">' +
                '               <a ng-if="model.notifications.length" class="control pull-right" ng-click="markAllAsRead(); $event.stopPropagation()" translate=".MARK_ALL_AS_READ"></a>' +
                '               <a ui-sref="notifications" translate=".GO_HISTORY"></a>' +
                '           </div>' +
                '       </li>' +
                '   </ul>' +
                '</div>',
            scope: true,
            link: function (scope) {
                scope.model = {
                    notifications: []
                };

                scope.sanitize = $sce.trustAsHtml;

                var user = {},
                    _realm;

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
                            //_realm = greyscaleProfileSrv.isSuperAdmin() ? greyscaleGlobals.adminSchema : Organization.realm;
                            greyscaleWebSocketSrv.on(wsEvents.notify, _getUnreadNotifications);
                            userNotificationsSrv.setUpdate(_getUnreadNotifications);
                            _getUnreadNotifications();
                        });
                }

                function _stopNotifyUpdate() {
                    user = {};
                    _realm = null;
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
                    if (_realm && user.id) {
                        greyscaleNotificationApi.list({
                                userTo: user.id,
                                read: false
                            }, _realm)
                            .then(function (notifications) {
                                scope.model.notifications = _.sortBy(notifications, 'created').reverse();
                            });
                    }
                }
            }
        };
    });
