/**
 * Created by igi on 20.01.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('checkboxList', function () {
        return {
            restrict: 'E',
            template: '<div class="panel panel-default"> <div class="checkbox" ng-repeat="item in listItems" ' +
                'ng-show="listItems.length>0"><label><input type="checkbox"  ng-model="item.checked" ng-change="onItemChange(item)"><div class="chk-box"></div>{{item.name}}</label></div>' +
                '<div class="row text-center" ng-hide="listItems.length>0"><h5>No Data.</h5></div></div>',
            scope: {
                listItems: '=?',
                onItemChange: '=onItemChange'
            }
        };
    });
