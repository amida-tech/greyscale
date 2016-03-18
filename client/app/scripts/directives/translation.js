/**
 * Created by igi on 27.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('translation', function ($compile, greyscaleModalsSrv, $log) {
        return {
            restrict: 'A',
            transclude: true,
            controller: function ($scope) {
                $scope.toggleTranslation = function () {
                    var _translation = {
                        essenceId: $scope.field.essenceId,
                        entityId: $scope.field.answerId,
                        value: $scope.field.answer,
                        field: 'value',
                        langId: $scope.field.langId
                    };

                    if (_translation.value) {
                        greyscaleModalsSrv.editTranslations(_translation)
                            .then(function (result) {
                                $log.debug(result);
                            });
                    }
                };
            },
            link: function (scope, elem) {
                var wrapper = angular.element('<div class="translation"/></div>');

                elem.after(wrapper);
                wrapper.prepend(elem);

                var anIcon = angular.element('<i class="fa fa-language text-info" ng-click="toggleTranslation()"></i>');

                $compile(anIcon)(scope);
                wrapper.append(anIcon);

                scope.$on('$destroy', function () {
                    wrapper.after(elem);
                    wrapper.remove();
                });
            }
        };
    });
