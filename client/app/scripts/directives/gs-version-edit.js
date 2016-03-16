/**
 * Created by igi on 16.03.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsVersionEdit', function (greyscaleSurveyAnswerApi, greyscaleUtilsSrv) {
        return {
            restrict: 'A',
            transclude: true,
            replace: true,
            template: '<div  class="form-group"><ng-transclude ng-hide="model.editMode" class="form-control-static"></ng-transclude>' +
            '<div ng-show="model.editMode">' +
            '<input type="text" class="form-control" ng-repeat="item in values" ng-model="item.val" ng-if="field.type!==\'paragraph\'"/>' +
            '<textarea class="form-control" ng-repeat="item in values" ng-model="item.val" ng-if="field.type===\'paragraph\'"></textarea>' +
            '<a class="btn btn-xs action-primary pull-right" ng-show="model.editMode" ng-click="apply()"><i class="fa fa-check"></i></a>' +
            '<a class="btn btn-xs action pull-right" ng-show="model.editMode" ng-click="cancel()"><i class="fa fa-minus"></i></a>' +
            '</div>' +
            '<a class="btn btn-xs action-primary pull-right" ng-hide="model.editMode || !model.editable" ng-click="edit()"><i class="fa fa-pencil"></i></a>' +
            '</div>',
            controller: function ($scope) {
                var fld = $scope.field;
                var answer = fld.prevAnswers[$scope.index];
                var textFields = ['text', 'paragraph', 'bullet_points'];

                $scope.values = scalarToObjects(answer.value);

                $scope.model = angular.extend({
                    editable: true || fld.flags.allowEdit && (textFields.indexOf(fld.type) !== -1 || fld.withOther && answer.value)
                }, $scope.model);

                $scope.edit = toggleEditMode;

                $scope.cancel = function () {
                    toggleEditMode();
                    $scope.values = scalarToObjects(answer.value);
                };

                $scope.apply = function () {
                    var _value,
                        _arr = objectsToScalar($scope.values);


                    if (fld.type === 'bullet_points') {
                        _value = angular.toJson(_arr);
                    } else {
                        _value = _arr[0];
                    }

                    greyscaleSurveyAnswerApi.update(answer.id, {
                        isResponse: answer.isResponse,
                        value: _value
                    })
                        .then(function (resp) {
                            if (resp === 'updated') {
                                if (fld.type === 'bullet_points') {
                                    answer.value = _arr;
                                } else {
                                    answer.value = _arr[0];
                                }
                            }
                        })
                        .catch(greyscaleUtilsSrv.errorMsg)
                        .finally(toggleEditMode);
                };

                function toggleEditMode() {
                    $scope.model.editMode = !$scope.model.editMode;
                }

                function scalarToObjects(value) {
                    var i, qty,
                        data = [],
                        isArray = angular.isArray(value);

                    if (isArray) {
                        qty = value.length;
                        for (i = 0; i < qty; i++) {
                            data.push({val: value[i]});
                        }
                    } else {
                        data.push({val: value});
                    }
                    return data;
                }

                function objectsToScalar(objs) {
                    var i,
                        data =[],
                        qty = objs.length;

                    for (i=0; i<qty; i++) {
                        data.push(objs[i].val);
                    }
                    return data;
                }
            }
        };
    });
