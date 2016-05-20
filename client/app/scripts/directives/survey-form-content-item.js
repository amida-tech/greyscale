/**
 * Created by igi on 12.02.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('surveyFormContentItem', function ($compile) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                contentItem: '=?',
                gotoField: '=?'
            },
            template: '',
            link: function (scope, elem) {
                if (scope.contentItem) {
                    var item = '<li><a ng-click="gotoField(contentItem.href)"><i ng-if="contentItem.flagged" class="text-danger fa fa-flag"></i> {{contentItem.title}}</a>';
                    if (scope.contentItem.sub) {
                        scope.model = scope.contentItem.sub;
                        item += '<ul class="survey-content"><survey-form-content-item content-item="item" ng-repeat="item in model" goto-field="gotoField"></survey-form-content-item></ul>';
                    }
                    item += '</li>';
                    elem.append(item);
                    $compile(elem.contents())(scope);
                }
            }
        };
    });
