/**
 * Created by igi on 04.03.16.
 */
angular.module('greyscaleApp')
    .directive('bulletItem', function () {
        return {
            restrict: 'E',
            scope: {
                answer: '=',
                isLast: '=',
                options: '=',
                add: '&addItem',
                remove: '&removeItem'
            },
            template: '<div class="input-group"><input type="text" class="form-control" ng-model="answer.data" ' +
                'ng-required="!isLast && options.required" ng-readonly="options.readonly" ng-change="add()" gs-valid="answer"> ' +
                '<span class="input-group-btn"><button class="btn" ng-disabled="(options.readonly || isLast)" ng-click="remove()">' +
                '<i class="fa fa-trash action-danger"></i></button>{{model.isLast}}</span></div><span></span>' +
                '<p class="subtext"><span class="pull-right" ng-class="{error:answer.ngModel.$invalid }">' +
                '<span ng-if ="answer.ngModel.$error.required" translate="FORMS.FIELD_REQUIRED"></span></span>' +
                '<span class="pull-left">{{options.borders}}</span></p>'
        };
    });
