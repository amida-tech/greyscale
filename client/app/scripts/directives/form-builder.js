/**
 * Created by vkopytov on 21.12.15.
 */
'use strict';

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

angular.module('greyscaleApp')
    .directive('formBuilder', function (greyscaleGlobals, $compile, $timeout) {
        return {
            templateUrl: 'views/directives/form-builder.html',
            restrict: 'E',
            link: function (scope, elem, attr) {
                var formbuilder;
                var types = greyscaleGlobals.formBuilder.fieldTypes;
                var sizes = ['small', 'medium', 'large'];

                function formBuilderSave(json) {
                    var fields = JSON.parse(json).fields;
                    var questions = [];
                    var i, j;
                    for (i = 0; i < fields.length; i++) {
                        var typeIdx = types.indexOf(fields[i].field_type === 'yes_no' ? 'radio' : fields[i].field_type);
                        if (typeIdx === -1) {
                            continue;
                        }
                        var fo = fields[i].field_options;
                        var newQuestion = {
                            label: fields[i].label,
                            cid: fields[i].cid,
                            isRequired: fields[i].required,
                            attachment: fields[i].attachment,
                            type: typeIdx,
                            surveyId: scope.model.survey.id,
                            position: i + 1
                        };
                        questions.push(newQuestion);
                        if (!fo) {
                            continue;
                        }
                        newQuestion.description = fo.description ? fo.description : '';
                        newQuestion.qid = fo.qid ? fo.qid : '';
                        newQuestion.skip = fo.skip && !isNaN(fo.skip) ? parseInt(fo.skip) : 0;
                        newQuestion.size = fo.size ? sizes.indexOf(fo.size) : 0;
                        if (fo.minlength && !isNaN(fo.minlength)) {
                            newQuestion.minLength = parseInt(fo.minlength);
                        } else if (fo.min && !isNaN(fo.min)) {
                            newQuestion.minLength = parseInt(fo.min);
                        }
                        if (fo.maxlength && !isNaN(fo.maxlength)) {
                            newQuestion.maxLength = parseInt(fo.maxlength);
                        } else if (fo.max && !isNaN(fo.max)) {
                            newQuestion.maxLength = parseInt(fo.max);
                        }
                        newQuestion.isWordmml = fo.min_max_length_units ? fo.min_max_length_units === 'words' : undefined;
                        newQuestion.incOtherOpt = fo.include_other_option || fo.include_blank_option;
                        newQuestion.units = fo.units;
                        newQuestion.intOnly = fo.integer_only;
                        newQuestion.value = fo.value;
                        newQuestion.links = fo.links && fo.links.length > 0 ? JSON.stringify(fo.links) : undefined;
                        newQuestion.optionNumbering = fo.option_numbering ? fo.option_numbering : undefined;

                        if (!fo.options) {
                            continue;
                        }
                        newQuestion.options = [];
                        for (j = 0; j < fo.options.length; j++) {
                            var option = fo.options[j];
                            newQuestion.options.push({
                                label: option.label,
                                value: option.value,
                                isSelected: option.checked
                            });
                        }
                    }
                    if (!scope.model.survey.questions) {
                        scope.model.survey.questions = [];
                    }

                    for (i = scope.model.survey.questions.length - 1; i >= 0; i--) {
                        if (!scope.model.survey.questions[i]) {
                            scope.model.survey.questions.splice(i, 1);
                            continue;
                        }
                        if (scope.model.survey.questions[i].deleted) {
                            continue;
                        }

                        var isAvaliable = false;
                        for (j = questions.length - 1; j >= 0; j--) {
                            if ('c' + scope.model.survey.questions[i].id !== questions[j].cid) {
                                continue;
                            }
                            isAvaliable = true;
                            delete questions[j].cid;
                            questions[j].id = scope.model.survey.questions[i].id;
                            scope.model.survey.questions[i] = questions[j];

                            questions.splice(j, 1);
                        }
                        if (isAvaliable) {
                            continue;
                        }
                        if (scope.model.survey.questions[i].id) {
                            scope.model.survey.questions[i].deleted = true;
                        } else {
                            scope.model.survey.questions.splice(i, 1);
                        }
                    }
                    for (i = 0; i < questions.length; i++) {
                        delete questions[i].cid;
                        scope.model.survey.questions.push(questions[i]);
                    }
                    scope.model.survey.questions.sort(function (a, b) {
                        return a.position - b.position;
                    });
                    scope.$emit('form-changes-saved');
                    $timeout(function () {
                        scope.$apply();
                    });
                }

                function createFormBuilder() {
                    var data = [];
                    var i, j;

                    if (scope.model.survey && scope.model.survey.questions) {
                        for (i = 0; i < scope.model.survey.questions.length; i++) {
                            var question = scope.model.survey.questions[i];
                            if (!question) {
                                continue;
                            }
                            var type = types[question.type];
                            if (!type) {
                                continue;
                            }
                            var field = {
                                cid: 'c' + question.id,
                                field_type: type,
                                label: question.label,
                                required: question.isRequired,
                                attachment: question.attachment,
                                field_options: {
                                    description: question.description,
                                    size: question.size && question.size > -1 ? sizes[question.size] : 'small',
                                    minlength: question.minLength ? question.minLength : undefined,
                                    maxlength: question.maxLength ? question.maxLength : undefined,
                                    min_max_length_units: question.isWordmml ? 'words' : 'charecters',
                                    min: question.minLength ? question.minLength : undefined,
                                    max: question.maxLength ? question.maxLength : undefined,
                                    include_other_option: question.incOtherOpt,
                                    include_blank_option: question.incOtherOpt,
                                    units: question.units,
                                    integer_only: question.intOnly,
                                    qid: question.qid,
                                    value: question.value,
                                    links: question.links ? JSON.parse(question.links) : [],
                                    option_numbering: question.optionNumbering
                                }
                            };
                            data.push(field);
                            if (!question.options) {
                                continue;
                            }
                            field.field_options.options = [];
                            for (j = 0; j < question.options.length; j++) {
                                if (!question.options[j]) {
                                    continue;
                                }
                                field.field_options.options.push({
                                    label: question.options[j].label,
                                    value: question.options[j].value,
                                    checked: question.options[j].isSelected,
                                });
                            }
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
                        formbuilder.on('save', formBuilderSave);
                    }

                    var control = $('[form-builder-control]');
                    var controlCopy;
                    if (control.length) {
                        controlCopy = control.clone().html();
                        elem.find('.fb-form').after($compile(controlCopy)(scope));
                    }
                }

                scope.$watch(attr.ngModel, createFormBuilder);
            }
        };
    });
