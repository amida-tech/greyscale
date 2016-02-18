/**
 * Created by igi on 11.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyForm', function ($q, greyscaleGlobals, greyscaleSurveyAnswerApi, $log) {

        var fieldTypes = greyscaleGlobals.formBuilderFieldTypes;

        return {
            restrict: 'E',
            //            replace: true,
            templateUrl: 'views/directives/survey-form.html',
            scope: {
                surveyData: '='
            },
            link: function (scope, elem) {

                scope.$watch('surveyData', updateForm);

                function updateForm(data) {
                    if (data && data.survey) {

                        prepareFields(scope);

                        if (data.task && data.userId) {
                            loadAnswers(scope);
                        }

                        elem.prepend('<p class="subtext"><span class="required"></span>form is under construction</p>');

                    }
                }
            },
            controller: function ($scope) {

                $scope.goField = function (elemId) {
                    $log.debug('going to', elemId);
                };

                $scope.save = function () {
                    saveAnswers($scope);
                };
            }
        };

        function saveAnswers(scope) {
            $log.debug('survey answers saving');
            var answers = [];
            for (var f=0; f<scope.fields.length; f++) {
                var fld = scope.fields[f];
                $log.debug(fld);
                answers.push(fld.answer);
            }
            $log.debug(answers);
            greyscaleSurveyAnswerApi.save({});

        }

        function prepareFields(scope) {
            $log.debug(scope);
            scope.fields = [];
            scope.answers = {};
            scope.content = [];

            var content = [];
            var fields = [];
            var ref = [{
                fields: fields,
                content: content
            }];
            var survey = scope.surveyData.survey;

            var r = 0;

            for (var q = 0; q < survey.questions.length; q++) {
                var field = survey.questions[q];
                var type = fieldTypes[field.type];
                if (type) {
                    var item = {
                        type: type,
                        title: field.label,
                        href: '#c' + field.id
                    };

                    var fld = {
                        cid: 'q' + field.id,
                        type: type,
                        label: field.label,
                        description: field.description,
                        required: field.isRequired,
                        options: field.options,
                        minLength: field.minLength,
                        maxLength: field.maxLength,
                        inWords: field.isWordmml,
                        units: field.units,
                        intOnly: field.intOnly,
                        withOther: field.incOtherOpt,
                        value: field.value,
                        answer: null
                    };

                    if (type === 'section_end') { // close section
                        r--;
                    } else { //push data into current section
                        ref[r].content.push(item);
                        ref[r].fields.push(fld);
                    }

                    if (type === 'section_start') { // create subsection, move pointer to it
                        item.sub = [];
                        fld.sub = [];
                        ref[++r] = {
                            fields: fld.sub,
                            content: item.sub
                        };
                    }
                }
            }

            scope.fields = fields;
            scope.content = content;
        }

        function loadAnswers(scope) {
            var params = {
/*
                surveryId: scope.surveyData.survey.id,
                productId: scope.surveyData.task.productId,
                UOAid: scope.surveyData.task.uoaId,
                wfStepId: scope.surveyData.task.stepId,
                userId: scope.surveyData.userId
*/
            };

            greyscaleSurveyAnswerApi.list(params)
                .then(function (_answers) {
                    $log.debug('answers', _answers);
                    for (var v = 0; v < _answers.length; v++) {
                        scope.answers[_answers[v].questionId] = _answers[v].value;
                    }
                });
        }
    });
