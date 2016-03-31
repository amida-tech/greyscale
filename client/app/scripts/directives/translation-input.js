/**
 * Created by igi on 01.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('translationInput', function ($compile) {
        return {
            restrict: 'A',
            transclude: true,
            link: function (scope, elem) {
                var wrapper = angular.element('<div class="translation-input"/></div>');

                elem.after(wrapper);
                wrapper.prepend(elem);

                var anIcon = angular.element('<i class="fa fa-trash translation-icon action action-danger" ng-click="del($index)"></i>');

                $compile(anIcon)(scope);
                wrapper.append(anIcon);

                scope.$on('$destroy', function () {
                    wrapper.after(elem);
                    wrapper.remove();
                });
            }
        };
    });
