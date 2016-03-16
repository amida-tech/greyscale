/**
 * Created by igi on 16.03.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsVersionEdit', function ($log) {
        return {
            restrict: 'A',
            transclude: true,
            replace: true,
            template: '<div  class="form-group"><ng-transclude ng-hide="model.editMode" class="form-control-static"></ng-transclude>' +
            '<div ng-show="model.editMode">' +
            '<input type="text" class="form-control" ng-repeat="item in values" ng-model="item" ng-if="field.type!==\'paragraph\'"/>' +
            '<textarea class="form-control" ng-repeat="item in values" ng-model="item" ng-if="field.type===\'paragraph\'"></textarea>' +
            '</div>' +
            '<a class="btn btn-xs action-primary pull-right" ng-show="model.editMode" ng-click="apply()"><i class="fa fa-check"></i></a>' +
            '<a class="btn btn-xs action pull-right" ng-show="model.editMode" ng-click="cancel()"><i class="fa fa-minus"></i></a>' +
            '<a class="btn btn-xs action-primary pull-right" ng-hide="model.editMode || !model.editable" ng-click="edit()"><i class="fa fa-pencil"></i></a>' +
            '</div>',
            
            controller: function ($scope) {
                var fld = $scope.field;
                var answer = fld.prevAnswers[$scope.index];
                var textFields = ['text', 'paragraph', 'bullet_points'];
                fld.flags.allowEdit = true;

                $scope.model = angular.extend({
                    editable: fld.flags.allowEdit && (textFields.indexOf(fld.type) !== -1 || fld.withOther && answer.value)
                }, $scope.model);

                fillValues();

                $log.debug($scope.values);

                $scope.edit = toggleEditMode;

                $scope.cancel = function () {
                    toggleEditMode();
                    fillValues();
                };

                $scope.apply = function() {
                    toggleEditMode();
                };

                function toggleEditMode() {
                    $scope.model.editMode = !$scope.model.editMode;
                }

                function _edit() {
                    $scope.model.editMode = !$scope.model.editMode;
                }

                function fillValues() {
                    if (fld.type === 'bullet_points') {
                        $scope.values = answer.value
                    } else {
                        $scope.values = [answer.value];
                    }
                }
            }
        };
    });
