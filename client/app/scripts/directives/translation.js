/**
 * Created by igi on 27.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('translation', function ($compile, greyscaleModalsSrv, $log) {
        return {
            scope: {
                translation: '=?'
            },
            restrict: 'A',
            link: function (scope, elem) {
                var wrapper = angular.element('<div class="translation"/></div>');

                elem.after(wrapper);
                wrapper.prepend(elem);

                var anIcon = angular.element('<i class="fa fa-language text-info" ng-click="toggleTranslation()"></i>');

                $compile(anIcon)(scope);
                wrapper.append(anIcon);

                scope.toggleTranslation = function () {
                    greyscaleModalsSrv.editTranslations(scope.translation)
                        .then(function (result) {
                            $log.debug(result);
                        });
                };

                scope.$on('$destroy', function () {
                    wrapper.after(elem);
                    wrapper.remove();
                });
            }
        };
    });
