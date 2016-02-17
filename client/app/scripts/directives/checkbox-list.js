/**
 * Created by igi on 20.01.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('checkboxList', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="checkbox-list"> <div ng-repeat="item in listItems" ' +
                'ng-show="listItems.length>0"><div class="checkbox"><label><input type="checkbox"  ng-model="item.checked" ng-change="onItemChange(item)"><div class="chk-box"></div>{{item.name}}</label></div></div>' +
                '<div class="row text-center" ng-hide="listItems.length>0"><h5>No Data.</h5></div></div>',
            scope: {
                listItems: '=?',
                onItemChange: '=onItemChange'
            }
        };
    });
