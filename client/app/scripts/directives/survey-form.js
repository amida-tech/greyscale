/**
 * Created by igi on 11.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyForm', function ($q, greyscaleGlobals, greyscaleSurveyAnswerApi, $log) {

        var fieldTypes = greyscaleGlobals.formBuilderFieldTypes;

        /*
         var survey;
         var surveyId;
         var taskId;
         var taskInfo;
         var constUrl = 'http://indaba.ntrlab.ru:83/dev/v0.2/';
         var dataFields;
         var currentParent;
         var content;
         var userId;
         var hasChanges = false;
         */
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

                        prepareFields(scope, data);

                        if (data.task && data.userId) {
                            loadAnswers(scope, data);
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
                    $log.debug('implement survey saving');
                    //greyscaleSurveyAnswerApi.save({});
                };
            }
        };

        function prepareFields(scope, surveyData) {
            scope.fields = [];
            scope.answers = {};
            scope.content = [];

            var content = [];
            var fields = [];
            var ref = [{
                fields: fields,
                content: content
            }];

            var r = 0;

            for (var q = 0; q < surveyData.survey.questions.length; q++) {
                var field = surveyData.survey.questions[q];
                var type = fieldTypes[field.type];
                if (type) {
                    var item = {
                        type: type,
                        title: field.label,
                        href: '#c' + field.id
                    };

                    var fld = {
                        cid: 'c' + field.id,
                        type: type,
                        label: field.label,
                        required: field.isRequired,
                        options: {}
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

        function loadAnswers(scope, surveyData) {
            var params = {
                surveryId: surveyData.survey.id,
                productId: surveyData.task.productId,
                UOAid: surveyData.task.uoaId,
                wfStepId: surveyData.task.stepId,
                userId: surveyData.userId
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
