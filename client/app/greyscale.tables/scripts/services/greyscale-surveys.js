'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleSurveysTbl', function (greyscaleSurveyApi, greyscaleQuestionApi, greyscaleModalsSrv, inform, $log, $location) {
    var _getSurveys = function () {
        return greyscaleSurveyApi.list();
    };
    
    function _getQuestionFunction(_newSurvey, question) {
        return function (newSurvey) {
            question.surveyId = newSurvey && newSurvey.id ? newSurvey.id : _newSurvey.id;
            if (question.id) {
                return greyscaleQuestionApi.update(question);
            } else {
                return greyscaleQuestionApi.add(question);
            }
        }
    }
    
    var _editSurvey = function (_survey) {
        var _newSurvey;
        return greyscaleSurveyApi.get(_survey.id).get().then(function (newSurvey) {
            return greyscaleModalsSrv.editSurvey(newSurvey);
        }).then(function (newSurvey) {
            _newSurvey = newSurvey;
            newSurvey.productId = 2;
            if (newSurvey.id) {
                return greyscaleSurveyApi.update(newSurvey);
            } else {
                return greyscaleSurveyApi.add(newSurvey);
            }
        }).then(function (newSurvey) {
            if (!newSurvey) newSurvey = _newSurvey;
            var questionsFunctions = [];
            for (var i = 0; i < newSurvey.questions.length; i++) {
                questionsFunctions.push(new Promise(_getQuestionFunction(_newSurvey, newSurvey.questions[i])));
            }
            return Promise.all(questionsFunctions);
        }).then(_reload).catch(function (err) {
            if (!err) {
                return;
            }
            $log.debug(err);
            var msg = 'Survey update error';
            if (err.data && err.data.message) {
                msg += ': ' + err.data.message;
            }
            inform.add(msg, {
                type: 'danger'
            });
        });

    };
    
    var _reload = function () {
        _greyscaleSurvey.tableParams.reload();
    };
    
    var _greyscaleSurvey = {
        title: 'Surveys',
        icon: 'fa-list',
        cols: [{
                field: 'id',
                title: 'ID',
                show: true,
                sortable: 'id'
            }, {
                field: 'title',
                title: 'Title',
                show: true,
                sortable: 'title'
            }, {
                field: 'description',
                title: 'Description',
                show: true,
                sortable: 'description'
            }, {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [{
                        title: 'Edit',
                        class: 'info',
                        handler: _editSurvey
                    }, {
                        title: 'Delete',
                        class: 'danger',
                        handler: function (_survey) {
                            greyscaleSurveyApi.delete(_survey).then(_reload).catch(function (err) {
                                inform.add('Survey delete error: ' + err);
                            });
                        }
                    }, {
                        title: 'View',
                        class: 'info',
                        handler: function (_survey) {
                            var url = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/interviewRenderer/#' + _survey.id;
                            window.location = url;
                        }
                    }
                ]
            }],
        sorting: {
            'id': 'asc'
        },
        dataPromise: _getSurveys,
        add: {
            title: 'add',
            handler: _editSurvey
        }
    };
    
    return _greyscaleSurvey;
});
