'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleProjectSurveysTbl', function ($q, greyscaleSurveyApi,
        greyscaleProjectApi, greyscaleModalsSrv,
        $rootScope, greyscaleUtilsSrv, inform, $log, $location) {

        var tns = 'SURVEYS.';

        var _cols = [{
            field: 'title',
            title: tns + 'NAME',
            show: true,
            sortable: 'title',
            dataRequired: true,
            dataFormat: 'text'
        }, {
            field: 'description',
            title: tns + 'DESCRIPTION',
            show: true,
            dataRequired: false,
            dataFormat: 'text'
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                title: tns + 'VIEW',
                class: 'info',
                handler: _viewSurvey
            }, {
                title: tns + 'FIELDS',
                class: 'info',
                handler: _editSurveyFields
            }, {
                title: '',
                icon: 'fa-pencil',
                class: 'info',
                handler: _editSurvey
            }, {
                title: '',
                icon: 'fa-trash',
                class: 'danger',
                handler: _removeSurvey
            }]
        }];

        var _table = {
            cols: _cols,
            sorting: {
                'id': 'asc'
            },
            dataPromise: _getData,
            dataFilter: {},
            formTitle: tns + 'ITEM',
            add: {
                title: 'COMMON.CREATE',
                handler: _editSurvey
            }
        };

        function _getProjectId() {
            return _table.dataFilter.projectId;
        }

        function _getData() {
            var projectId = _getProjectId();
            if (!projectId) {
                return $q.reject();
            } else {
                return greyscaleProjectApi.surveysList(projectId);
            }
        }

        function _editSurvey(survey) {
            var op = 'editing';
            _table.formSaveButton = survey && survey.id ? null : 'COMMON.FURTHER';
            greyscaleModalsSrv.editRec(survey, _table)
                .then(function (newSurvey) {
                    if (newSurvey.id) {
                        return greyscaleSurveyApi.update(newSurvey);
                    } else {
                        op = 'adding';
                        newSurvey.projectId = _getProjectId();
                        return $q.when(newSurvey);
                    }
                })
                .then(function (newSurvey) {
                    if (!newSurvey.id) {
                        return _editSurveyFields(newSurvey)
                            .then(function (newSurveyWithFields) {
                                newSurvey = newSurveyWithFields;
                                greyscaleSurveyApi.add(newSurvey);
                            });
                    } else {
                        return $q.when(newSurvey);
                    }
                })
                .then(_reload)
                .catch(function (err) {
                    return _errHandler(err, op);
                });
        }

        function _editSurveyFields(_survey) {
            return greyscaleModalsSrv.editSurvey(_survey)
                .catch(function (err) {
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
        }

        function _removeSurvey(_survey) {
            greyscaleSurveyApi.delete(_survey).then(_reload).catch(function (err) {
                inform.add('Survey delete error: ' + err);
            });
        }

        function _viewSurvey(_survey) {
            var url = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/interviewRenderer/#' + _survey.id;
            window.location = url;
        }

        function _reload() {
            console.log('reload');
            _table.tableParams.reload();
        }

        function _errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
