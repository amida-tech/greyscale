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
        var wsEvents = greyscaleGlobals.events.webSocket;

        return {
            restrict: 'A',
            replace: true,
            template: '<div class="user-notifications dropdown" translate-namespace="NOTIFICATIONS">' +
                '   <a class="dropdown-toggle" data-toggle="dropdown">' +
                '       <i class="fa fa-bell-o" ng-class="{disabled:!model.notifications.length}"></i>' +
                '       <span ng-if="model.notifications.length" class="counter">{{model.notifications.length}}</span>' +
                '   </a>' +
                '   <ul class="dropdown-menu dropdown-menu-right">' +
                '       <li class="scroll">' +
                '           <div>' +
                '               <div class="notification" ng-repeat="notification in model.notifications track by $index">' +
                '                   <div class="sender">{{notification.userFromName}}</div>' +
                '                   <div class="send-time">{{notification.created|date:\'medium\'}}</div>' +
                '                   <p><b>{{notification.subject}}</b><br><span ng-bind-html="sanitize(notification.note)"></span></p>' +
                '                   <div class="control pull-right"><a ng-click="markAsRead(notification, $index); $event.stopPropagation()" translate=".MARK_AS_READ"></a></div>' +
                '                   <div class="clearfix"></div>' +
                '               </div>' +
                '           </div>' +
                '           <div ng-if="!model.notifications.length" class="notification">' +
                '               <p translate=".NO_UNREAD"></p>' +
                '           </div>' +
                '           <div class="go-history">' +
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

                var user = function () {};
                var _accessLevel, _realm;

                greyscaleProfileSrv.getProfile()
                    .then(function (profile) {
                        user = profile;
                        _accessLevel = greyscaleProfileSrv.getAccessLevelMask();
                        _realm = _isSuperAdmin() ? greyscaleGlobals.adminSchema : Organization.realm;
                        _getUnreadNotifications();
                        greyscaleWebSocketSrv.on(wsEvents.notify, _getUnreadNotifications);
                        greyscaleWebSocketSrv.on(wsEvents.policyLocked, function(data){
                            console.log('policy locked');
                            console.log(data);
                        });
                        greyscaleWebSocketSrv.on(wsEvents.policyUnlocked, function(){
                            console.log('policy unlocked');
                        });
                        userNotificationsSrv.setUpdate(_getUnreadNotifications, _realm);
                    });

                scope.markAsRead = function (notification, index) {
                    greyscaleNotificationApi.setRead(notification.id, _realm)
                        .then(function () {
                            scope.model.notifications.splice(index, 1);
                        });
                };

                function _isSuperAdmin() {
                    return ((_accessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
                }

                function _getUnreadNotifications() {
                    greyscaleNotificationApi.list({
                            userTo: user.id,
                            read: false
                        }, _realm)
                        .then(function (notifications) {
                            scope.model.notifications = _.sortBy(notifications, 'created').reverse();
                        });
                }

            }
        };
    });
