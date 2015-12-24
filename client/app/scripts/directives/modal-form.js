/**
 * Created by igi on 24.12.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('modalForm', function(){
       return {
           restrict: 'AE',
           scope: {
               dataForm: '@',
               dataRecord: '='
           }
       };
    });
