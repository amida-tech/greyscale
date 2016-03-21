/**
 * Created by igi on 27.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('translation', function ($compile, greyscaleModalsSrv, greyscaleUtilsSrv) {
        return {
            restrict: 'A',
            controller: function ($scope) {
                $scope.toggleTranslation = function () {
                    var
                        _field = $scope.field,
                        _answer = _field.answer,
                        _resp = $scope.resp,
                        _index = $scope.$index,
                        _translation = {
                            essenceId: _field.essenceId
                        },
                        _data = {};

                    if (_resp) {
                        _data = {
                            entityId: _resp.id,
                            langId: _resp.langId,
                            type: 'paragraph',
                            field: 'comments',
                            value: _resp.comments
                        };
                    } else {
                        _data = {
                            entityId: _field.answerId,
                            langId: _field.langId,
                            type: _field.type,
                            field: 'value',
                            value: _answer
                        };

                        switch (_field.type) {

                        case 'bullet_points':
                            _data.index = _index;
                            break;

                        case 'radio':
                        case 'checkboxes':
                            _data.value = _answer.value;
                            break;
                        }
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

                var anIcon = angular.element('<i class="fa fa-language translation-icon action action-primary" ng-click="toggleTranslation()"></i>');

                $compile(anIcon)(scope);
                wrapper.append(anIcon);

                scope.$on('$destroy', function () {
                    wrapper.after(elem);
                    wrapper.remove();
                });
            }
        };
    });
