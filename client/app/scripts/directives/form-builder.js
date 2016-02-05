/**
 * Created by vkopytov on 21.12.15.
 */
'use strict';

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

angular.module('greyscaleApp')
    .directive('formBuilder', function (_) {
    return {
        templateUrl: 'views/directives/form-builder.html',
        restrict: 'E',
        link: function (scope, elem, attr) {
            
            var formbuilder;
            var types = [
                'text',
                'paragraph',
                'checkboxes',
                'radio',
                'dropdown',
                'number',
                'email',
                'price',
                'selection_start',
                'selection_end',
                'selection_break'
            ];
            
            function createFormBuilder() {
                var data = [],
                    i;
                
                if (scope.model.survey && scope.model.survey.questions) {
                    for (i = 0; i < scope.model.survey.questions.length; i++) {
                        if (scope.model.survey.questions[i]) {
                            var type = types[scope.model.survey.questions[i].type];
                            if (type) {
                                data.push({
                                    cid: 'c' + scope.model.survey.questions[i].id,
                                    field_type: type,
                                    label: scope.model.survey.questions[i].label,
                                    required: scope.model.survey.questions[i].isRequired,
                                    field_options: {}
                                });
                                //if (type === 'checkbox' || type === 'radio' || type === 'dropdown') data[data.length - 1].field_options.options = [{
                                //        checked: false,
                                //        label: "",
                                //        skip: "",
                                //        value: ""
                                //    }];
                            }
                        }
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
                    scope.saveFormbuilder = function () {
                        if (formbuilder.mainView.formSaved) scope.$emit('form-changes-saved');
                        else formbuilder.mainView.saveForm();
                    };
                    formbuilder.on('save', function (json) {
                        debugger
                        var fields = JSON.parse(json).fields;
                        var questions = [];
                        for (i = 0; i < fields.length; i++) {
                            //var typeIdx = _.findIndex(types, fields[i].field_type);
                            var typeIdx = types.indexOf(fields[i].field_type);
                            if (typeIdx > -1) {
                                questions.push({
                                    label: fields[i].label,
                                    cid: fields[i].cid,
                                    //options: JSON.stringify(fields[i].field_options),
                                    isRequired: fields[i].required,
                                    type: typeIdx,
                                    surveyId: scope.model.survey.id,
                                    position: i + 1
                                });
                            }
                        }
                        if (scope.model.survey.questions) {
                            for (i = scope.model.survey.questions.length - 1; i >= 0; i--) {
                                if (!scope.model.survey.questions[i]) {
                                    scope.model.survey.questions.splice(i, 1);
                                    continue;
                                }
                                if (scope.model.survey.questions[i].deleted) {
                                    continue;
                                }
                                var isAvaliable = false;
                                for (var j = questions.length - 1; j >= 0; j--) {
                                    if ('c' + scope.model.survey.questions[i].id === questions[j].cid) {
                                        isAvaliable = true;
                                        delete questions[j].cid;
                                        questions[j].id = scope.model.survey.questions[i].id;
                                        scope.model.survey.questions[i] = questions[j];
                                        
                                        questions.splice(j, 1);
                                    }
                                }
                                if (!isAvaliable) {
                                    if (scope.model.survey.questions[i].id) {
                                        scope.model.survey.questions[i].deleted = true;
                                    } else {
                                        scope.model.survey.questions.splice(i, 1);
                                    }
                                }
                            }
                        } else {
                            scope.model.survey.questions = [];
                        }
                        
                        for (i = 0; i < questions.length; i++) {
                            delete questions[i].cid;
                            scope.model.survey.questions.push(questions[i]);
                        }
                        scope.model.survey.questions.sort(function (a, b) {
                            return a.position - b.position;
                        });
                        scope.$emit('form-changes-saved');
                        scope.$apply();
                    });
                }
            }
            
            scope.$watch(attr.ngModel, createFormBuilder);
        }
    };
});
