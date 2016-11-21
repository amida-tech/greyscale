'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleMyTasksFineshedTbl', function (_, $q, greyscaleTaskApi) {

        var tns = 'MY_TASKS.';

        var resDescr = [{
            title: tns + 'TASK',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-task.html'
        }, {
            title: tns + 'POLICY',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-view-survey.html'
        }, {
            field: 'startDate',
            sortable: true,
            title: tns + 'TERMS',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-terms.html'
        }, {
            title: tns + 'DESCRIPTION',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-product.html'
        }];

        return {
            title: tns + 'FINISHED_TITLE',
            icon: 'fa-tasks',
            sorting: {
                startDate: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            query: {}
        };

        function _getData() {
            return greyscaleTaskApi.myList().then(function (data) {
                return _.filter(data, function (item) {
                    return item.status === 'completed';
                });
            });
        }
    });
