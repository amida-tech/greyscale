/**
 * Created by igi on 27.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('translation', function ($compile, greyscaleModalsSrv, greyscaleUtilsSrv, $log) {
        return {
            restrict: 'A',
            transclude: true,
            controller: function ($scope) {
                $scope.toggleTranslation = function () {
                    var _translation = {
                        essenceId: $scope.field.essenceId,
                        entityId: $scope.field.answerId,
                        langId: $scope.field.langId,
                        type: $scope.field.type
                    };

                    var _data = {
                        field: 'value',
                        value: $scope.field.answer
                    };

                    switch ($scope.field.type) {
                    case 'radio':
                    case 'checkboxes':
                        _data.value = $scope.field.answer.value;
                        break;
                    }

                    angular.extend(_translation, _data);

                    if (_translation.value) {
                        greyscaleModalsSrv.editTranslations(_translation)
                            .catch(greyscaleUtilsSrv.errorMsg);
                    } else {
                        greyscaleUtilsSrv.errorMsg('TRANSLATION.NOTHING_TO_TRANSLATE');
                    }
                };
            },
            link: function (scope, elem) {
                var wrapper = angular.element('<div class="translation clearfix"/></div>');

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
