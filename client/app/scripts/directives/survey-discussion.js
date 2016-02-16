/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyDiscussion', function (greyscaleGlobals, i18n, $log) {
        var fieldTypes = greyscaleGlobals.formBuilderFieldTypes;
        var sectionTypes = [
            fieldTypes.indexOf('section_start'),
            fieldTypes.indexOf('section_end'),
            fieldTypes.lastIndexOf('section_break')
        ];

        return {
            restrict: 'E',
            replace: true,
            scope: {
                surveyData: '=?'
            },
            templateUrl: 'views/directives/survey-discussion.html',
            link: function (scope) {
                scope.$watch('surveyData', function (survey) {
                    updateDicscussion(survey, scope);
                });
            },
            controller: function ($scope) {
                $scope.model = {
                    questions: [],
                    associate: [{
                        id: 1,
                        firstName: 'John',
                        lastName: 'Doe'
                    }, {
                        id: 2,
                        firstName: 'Jane',
                        lastName: 'Doe'
                    }, {
                        id: 3,
                        firstName: 'Judy',
                        lastName: 'Doe'
                    }, {
                        id: 4,
                        firstName: 'James',
                        lastName: 'Doe'
                    }]
                };

                $scope.sendMsg = function () {
                    emptyMsgForm();
                };

                emptyMsgForm();

                function emptyMsgForm() {
                    $scope.model.msg = {
                        to: '',
                        thread: '',
                        body: ''
                    };
                }
            }
        };

        function updateDicscussion(survey, scope) {
            if (survey) {
                for (var q = 0; q < survey.questions.length; q++) {
                    var quest = survey.questions[q];
                    if (sectionTypes.indexOf(quest.type) === -1) {
                        scope.model.questions.push({
                            id: quest.id,
                            title: i18n.translate('SURVEYS.QUESTION') + ' ' + (q + 1),
                            label: quest.label,
                            isOpen: false,
                            messages: [{
                                id: 0,
                                sent: new Date().toUTCString(),
                                read: null,
                                flagged: (quest.id % 2 === 0),
                                from: scope.model.associate[quest.id % 4],
                                to: scope.model.associate[(quest.id + 11) % 4],
                                body: greyscaleGlobals.loremIpsum
                            }]
                        });
                    }
                }
            }

        }
    });
