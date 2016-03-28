/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsMessage', function () {
        return {
            restrict: 'A',
            scope: {
                gsMessage: '='
            },
            template: '<span class="gs-message-from">{{gsMessage.from.firstName}} {{gsMessage.from.lastName}}' +
                '<i class="fa fa-flag pull-right" ng-show="gsMessage.flagged" ' +
                '   ng-class="{\'text-success\':gsMessage.resolved, \'text-danger\':!gsMessage.resolved}"></i></span>' +
                '<div class="gs-message-body"><span>{{gsMessage.body}}</span></div>' +
                '<p class="subtext">{{gsMessage.sent | date}}</p>'
        };
    });
