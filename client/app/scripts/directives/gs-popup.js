/**
 * Created by igi on 24.05.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('gsPopup', function ($compile, $log) {
        return {
            restrict: 'A',
            transclude: true,
            scope: {
                gsPopup: '='
            },
            template: '<ng-transclude></ng-transclude><ul id="{{model.menuId}}" class="dropdown-menu" role="menu" style="display:block" >' +
        '<li class="dropdown-header">Actions</li><li class="divider"><li><li ng-repeat="item in gsPopup"><a translate="{{item.title}}" ng-click="item.action"></a>' +
        '</ul>',
            link: function (scope, elem, attrs) {
                scope.model = {
                    menuId: 'mnu_' + new Date().getTime()
                };

                elem.on('contextmenu', function (evt) {
                    evt.preventDefault();
                    $log.debug('context menu event', evt);
                    elem.find('#' + scope.model.menuId)
                        .show()
                        .css({
                            position: "absolute",
                            left: evt.offsetX,
                            top: evt.offsetY

                        })
                });
            }
        };
    });
