/**
 * Created by igi on 28.06.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsCoAnswers', function ($log) {
        return {
            restrict: 'AE',
            scope: {
                field: '='
            },
            templateUrl: 'views/directives/gs-co-answers.html',
            controller: function ($scope, i18n) {
                $scope.model = {
                    collapsed: true
                };
                $scope.getAuthor = _getName;
                $scope.getBulletsText = _getBulletPoints;
                $scope.getDropdownText = _getDdText;
                $scope.isChecked = _isChecked;

                function _getName(userId) {
                    return $scope.field.collaborators[userId] ? $scope.field.collaborators[userId].fullName : '';
                }

                function _isChecked(answer, option) {
                    return ~answer.optionId.indexOf(option.id);
                }

                function _getBulletPoints(value) {
                    return value.join(', ');
                }

                function _getDdText(answer) {
                    var _res = null;

                    if (answer.optionId && answer.optionId.length > 0) {
                        _res = _.find($scope.field.options, {id: answer.optionId[0]});
                        _res = _res.label;
                    }

                    if (_res === null) {
                        _res = i18n.translate('SURVEYS.NO_OPTIONS_WAS_SELECTED');
                    }

                    return _res;
                }
            }
        };
    });
