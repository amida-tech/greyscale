/**
 * Created by vkopytov on 21.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('formBuilder', function () {
    return {
        templateUrl: 'views/directives/form-builder.html',
        restrict: 'E',
        link: function (scope, elem, attr) {
            
            var formbuilder;
            
            function createFormBuilder() {
                var data = [];
                if (scope.model && scope.model.questions) {
                    for (var i = 0; i < scope.model.questions.length; i++) {
                        var type;
                        switch (scope.model.questions[i].type) {
                            case 0: type = 'text'; break;
                            case 1: type = 'paragraph'; break;
                            case 2: type = 'checkbox'; break;
                            case 3: type = 'radio'; break;
                            case 4: type = 'dropdown'; break;
                            case 5: type = 'number'; break;
                            case 6: type = 'email'; break;
                            case 7: type = 'price'; break;
                            case 8: type = 'section_start'; break;
                            case 9: type = 'section_end'; break;
                            case 10: type = 'section_break'; break;
                            default: continue;
                        }
                        
                        data.push({
                            cid: 'c' + scope.model.questions[i].id,
                            field_type: type,
                            label: scope.model.questions[i].label,
                            required: scope.model.questions[i].isRequired,
                            field_options: {}                            
                        });
                    }
                }
                if (formbuilder) {
                    formbuilder.off('save');
                        //delete formbuilder;
                }
                if (window.Formbuilder) {
                    formbuilder = new window.Formbuilder({
                        selector: '#formbuilder',
                        bootstrapData: data
                    });
                    formbuilder.on('save', function (json) {
                        var fields = JSON.parse(json).fields;
                        var questions = [];
                        for (var i = 0; i < fields.length; i++) {
                            var type;
                            switch (fields[i].field_type) {
                                case 'text': type = 0; break;
                                case 'paragraph': type = 1; break;
                                case 'checkbox': type = 2; break;
                                case 'radio': type = 3; break;
                                case 'dropdown': type = 4; break;
                                case 'number': type = 5; break;
                                case 'email': type = 6; break;
                                case 'price': type = 7; break;
                                case 'section_start': type = 8; break;
                                case 'section_end': type = 9; break;
                                case 'section_break': type = 10; break;
                                default: continue;
                            }
                            
                            questions.push({
                                label: fields[i].label,
                                cid: fields[i].cid,
                                //options: JSON.stringify(fields[i].field_options),
                                isRequired: fields[i].required,
                                type: type,
                                surveyId: scope.model.id,
                                //position: i
                            });
                        }
                        for (var i = 0; i < questions.length; i++) {
                            var isNew = true;
                            for (var j = 0; j < scope.model.questions.length; j++) {
                                if ('c' + scope.model.questions[j].id !== questions[i].cid) continue;
                                isNew = false
                                delete questions[i].cid;
                                questions[i].id = scope.model.questions[j].id;
                                scope.model.questions[j] = questions[i];
                                break;
                            }
                            delete questions[i].cid;
                            if (isNew) scope.model.questions.push(questions[i]);
                        }
                        scope.$apply();
                    });
                }
            }
            
            scope.$watch(attr.ngModel, createFormBuilder);
        }
    };
});
