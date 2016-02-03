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
                if (scope.model.survey && scope.model.survey.questions) {
                    for (var i = 0; i < scope.model.survey.questions.length; i++) {
                        var type;
                        switch (scope.model.survey.questions[i].type) {
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
                            cid: 'c' + scope.model.survey.questions[i].id,
                            field_type: type,
                            label: scope.model.survey.questions[i].label,
                            required: scope.model.survey.questions[i].isRequired,
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
                                surveyId: scope.model.survey.id,
                                position: i + 1
                            });
                        }
                        if (scope.model.survey.questions) {
                            for (var i = scope.model.survey.questions.length - 1; i >= 0; i--) {
                                if (scope.model.survey.questions[i].deleted) continue;
                                var isAvaliable = false
                                for (var j = questions.length - 1; j >= 0; j--) {
                                    if ('c' + scope.model.survey.questions[i].id !== questions[j].cid) continue;
                                    isAvaliable = true;
                                    delete questions[j].cid;
                                    questions[j].id = scope.model.survey.questions[i].id;
                                    scope.model.survey.questions[i] = questions[j];
                                    
                                    questions.splice(j, 1);
                                }
                                if (!isAvaliable) scope.model.survey.questions[i].deleted = true;
                            }
                        } else scope.model.survey.questions = [];
                        
                        for (var i = 0; i < questions.length; i++) {
                            delete questions[i].cid;
                            scope.model.survey.questions.push(questions[i]);
                        }
                        
                        scope.model.survey.questions.sort(function (a, b) { return a.position - b.position; });

                        scope.$apply();
                    });
                }
            }
            
            scope.$watch(attr.ngModel, createFormBuilder);
        }
    };
});
