/**
 * Created by vkopytov on 21.12.15.
 */
'use strict';

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

angular.module('greyscaleApp')
    .directive('formBuilder', function (greyscaleGlobals) {
    return {
        templateUrl: 'views/directives/form-builder.html',
        restrict: 'E',
        link: function (scope, elem, attr) {
            
            var formbuilder;
            var types = greyscaleGlobals.formBuilderFieldTypes;
            var sizes = ['small', 'medium', 'large'];
            
            function createFormBuilder() {
                var data = [],
                    i;
                
                if (scope.model.survey && scope.model.survey.questions) {
                    for (i = 0; i < scope.model.survey.questions.length; i++) {
                        var question = scope.model.survey.questions[i];
                        if (!question) continue;
                        var type = types[question.type];
                        if (!type) continue;
                        data.push({
                            cid: 'c' + question.id,
                            field_type: type,
                            label: question.label,
                            required: question.isRequired,
                            field_options: {
                                description: question.description,
                                skip: question.skip,
                                size: question.size && question.size > -1 ? sizes[question.size] : 'small',
                                minlength: question.minLength ? question.minLength : undefined,
                                maxlength: question.maxLength ? question.maxLength : undefined,
                                min_max_length_units: question.isWordmml ? 'words' : 'charecters',
                                include_other_option: question.incOtherOpt,
                                include_blank_option: question.incOtherOpt,
                                units: question.units,
                                integer_only: question.intOnly
                            }
                        });
                    }
                }
                if (formbuilder) {
                    formbuilder.off('save');
                }
                if (window.Formbuilder) {
                    formbuilder = new window.Formbuilder({
                        selector: '#formbuilder',
                        bootstrapData: data
                    });
                    scope.saveFormbuilder = function () {
                        if (formbuilder.mainView.formSaved) {
                            scope.$emit('form-changes-saved');
                        } else {
                            formbuilder.mainView.saveForm();
                        }
                    };
                    formbuilder.on('save', function (json) {
                        var fields = JSON.parse(json).fields;
                        var questions = [];
                        for (i = 0; i < fields.length; i++) {
                            var typeIdx = types.indexOf(fields[i].field_type);
                            if (typeIdx > -1) {
                                questions.push({
                                    label: fields[i].label,
                                    cid: fields[i].cid,
                                    isRequired: fields[i].required,
                                    type: typeIdx,
                                    surveyId: scope.model.survey.id,
                                    position: i + 1,
                                    description: fields[i].field_options && fields[i].field_options.description ? fields[i].field_options.description : '',
                                    skip: fields[i].field_options && fields[i].field_options.skip ? parseInt(fields[i].field_options.skip) : 0,
                                    size: fields[i].field_options && fields[i].field_options.size ? sizes.indexOf(fields[i].field_options.size) : 0,
                                    minLength: fields[i].field_options && fields[i].field_options.minlength ? parseInt(fields[i].field_options.minlength) : undefined,
                                    maxLength: fields[i].field_options && fields[i].field_options.maxlength ? parseInt(fields[i].field_options.maxlength) : undefined,
                                    isWordmml: fields[i].field_options && fields[i].field_options.min_max_length_units ?  fields[i].field_options.min_max_length_units === 'words' : undefined,
                                    incOtherOpt: fields[i].field_options && (fields[i].field_options.include_other_option || fields[i].field_options.include_blank_option) ? true : false,
                                    units: fields[i].field_options && fields[i].field_options.units ? fields[i].field_options.units : '',
                                    intOnly: fields[i].field_options && fields[i].field_options.integer_only ? true : false,
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
