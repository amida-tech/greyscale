/**
 * Created by igi on 27.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('translate', function ($compile, $log) {
        return {
            scope: {
                translation: '=translate'
            },
            restrict: 'A',
            link: function (scope, elem) {
                var wrapper = angular.element('<div class="translate"/></div>');

                elem.after(wrapper);
                wrapper.prepend(elem);

                var anIcon = angular.element('<i class="fa fa-language text-info" ng-click="toggleTranslate()"></i>');

                $compile(anIcon)(scope);
                wrapper.append(anIcon);

                scope.toggleTranslate = function() {
                    $log.debug('translating', scope.translation);
                };

                scope.$on('$destroy', function() {
                    wrapper.after(elem);
                    wrapper.remove();
                });
            }
        };
    });
