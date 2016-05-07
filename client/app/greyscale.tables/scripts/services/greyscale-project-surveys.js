'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleProjectSurveysTbl', function ($q, $state, greyscaleSurveyApi, greyscaleProjectApi,
        greyscaleModalsSrv, greyscaleUtilsSrv) {

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
            field: 'isDraft',
            title: tns + 'STATUS',
            show: true,
            cellTemplate: '<span ng-if="cell" class="text-warning" translate="SURVEYS.IS_DRAFT"></span><span ng-if="!cell" class="text-success" translate="SURVEYS.IS_COMPLETE"></span>'
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-eye',
                tooltip: 'COMMON.VIEW',
                handler: _viewSurvey
            }, {
                icon: 'fa-pencil',
                tooltip: 'COMMON.EDIT',
                handler: _editSurvey
            }, {
                icon: 'fa-trash',
                tooltip: 'COMMON.DELETE',
                handler: _deleteSurvey
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
            pageLength: 10,
            add: {
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

        function _reload() {
            console.log('reload');
            _table.tableParams.reload();
        }

        function _editSurvey(_survey) {
            if (_survey && _survey.projectId) {
                $state.go('policy.edit', {
                    id: _survey.id
                });
            } else {
                $state.go('projects.setup.surveys.edit', {
                    surveyId: _survey ? _survey.id : 'new',
                    projectId: _getProjectId()
                });
            }
        }

        function _deleteSurvey(_survey) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                survey: _survey,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleSurveyApi.delete(_survey).then(_reload).catch(function (err) {
                    greyscaleUtilsSrv.errorMsg(err, 'Survey delete error');
                });
            });
        }

        function _viewSurvey(_survey) {
            $state.go('survey', {
                surveyId: _survey.id
            });
        }

        return _table;
    });
