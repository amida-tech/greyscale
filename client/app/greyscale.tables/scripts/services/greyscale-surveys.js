'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleSurveysTbl', function (greyscaleSurveyApi, inform, $log, $location, $state) {
    var _getSurveys = function () {
        return greyscaleSurveyApi.list();
    };
    
    
    var _editSurvey = function (_survey) {
        $state.go('survey.edit', {
            surveyId: _survey ? _survey.id : -1,
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
