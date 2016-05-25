/**
 * Created by igi on 24.05.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('gsContextMenu', function () {
        return {
            restrict: 'A',
            transclude: true,
            scope: {
                gsContextMenu: '='
            },
            template: '<ng-transclude></ng-transclude><ul data-toggle="dropdown" id="{{model.menuId}}" class="dropdown-menu" role="menu">' +
                '<li class="dropdown-header" translate="CONTEXT_MENU.TITLE"></li><li class="divider"></li>' +
                '<li ng-repeat="item in gsContextMenu"><a translate="{{item.title}}" ng-click="item.action(model.range)"></a></li></ul>',
            link: function (scope, elem) {
                scope.model = {
                    menuId: 'mnu_' + new Date().getTime(),
                    range: null
                };

                elem.on('contextmenu', function (evt) {
                    scope.model.range = window.getSelection().getRangeAt(0);
                    evt.preventDefault();
                    elem.find('#' + scope.model.menuId)
                        .css({
                            left: evt.offsetX,
                            top: evt.offsetY
                        });
                    elem.addClass('open');
                });
            }
        };
    });
