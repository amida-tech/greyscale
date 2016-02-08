'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleMyTasksTbl', function ($q, greyscaleTaskApi) {

        var resDescr = [{
            title: 'Task',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-task.html'
        }, {
            title: 'Survey',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-survey.html'

        }, {
            title: 'Unit Of Analysis',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-uoa.html'
        }, {
            title: 'Terms',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-terms.html'
        }, {
            title: 'Product',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-product.html'
        }];

        var _table = {
            title: 'My Tasks',
            icon: 'fa-tasks',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            //add: {
            //    title: 'Add',
            //    handler: _addUoaTagLink
            //},
            query: {}
        };

        function _getData() {
            return greyscaleTaskApi.myList();
        }

        return _table;
    });
