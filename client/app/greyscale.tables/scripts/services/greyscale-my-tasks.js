'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleMyTasksTbl', function ($q, greyscaleTaskApi) {

        var resDescr = [{
            field: 'id',
            title: 'ID',
            show: false,
            dataFormat: 'text',
            dataRequired: true,
            dataReadOnly: 'both'
        }, {
            field: 'title',
            title: 'Title',
            show: true
        }, {
            field: 'description',
            title: 'Description',
            show: true
        }, {
            field: 'step.startDate',
            title: 'Start Date',
            dataFormat: 'date',
            show: true
        }, {
            field: 'step.endDate',
            title: 'End Date',
            dataFormat: 'date',
            show: true
        }, {
            field: 'step.title',
            title: 'Step',
            show: true
        }, {
            field: 'product.name',
            title: 'Product',
            show: true
        }, {
            field: 'project.name',
            title: 'Project',
            show: true
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
