'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleMyTasksTbl', function ($q, greyscaleTaskApi) {

        var tns = "MY_TASKS.";

        var resDescr = [{
            title: tns + 'TASK',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-task.html'
        }, {
            title: tns + 'SURVEY',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-survey.html'

        }, {
            title: tns + 'UOA',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-uoa.html'
        }, {
            title: tns + 'TERMS',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-terms.html'
        }, {
            title: tns + 'PRODUCT',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-product.html'
        }];

        var _table = {
            title: tns + 'TITLE',
            icon: 'fa-tasks',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            query: {}
        };

        function _getData() {
            return greyscaleTaskApi.myList();
        }

        return _table;
    });
