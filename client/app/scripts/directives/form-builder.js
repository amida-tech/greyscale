/**
 * Created by vkopytov on 21.12.15.
 */
"use strict";

angular.module('greyscaleApp')
    .directive('formBuilder', function () {
    return {
        templateUrl: 'views/directives/form-builder.html',
        restrict: 'E',
        link: function (scope, elem, attr) {
            
            var formbuilder;
            function createFormBuilder() {
                var data = scope.model && scope.model.data ? JSON.parse(scope.model.data).fields : undefined;
                if (formbuilder) {
                    formbuilder.off('save');
                    //delete formbuilder;
                }
                formbuilder = new Formbuilder({ selector: '#formbuilder', bootstrapData: data });                
                formbuilder.on('save', function (json) {
                    document.getElementById('data').value = json;
                    scope.dataForm.data.$setViewValue(json);
                    scope.$apply();
                });
            }
            
            scope.$watch(attr.ngModel, function (value) { createFormBuilder(); });
        }
    };
    
    a = {
        " fields ": [
            { " label ": " Untitled ", " field_type ": " text ", " required ": true, " field_options ": { " size ": " small " }, " cid ": " c2 " }, 
            { " label ": " Untitled ", " field_type ": " price ", " required ": true, " field_options ": {}, " cid ": " c6 " }
        ]
    }
});
