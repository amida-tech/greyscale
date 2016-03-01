'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleMyTasksFutureTbl', function (_, $q, greyscaleTaskApi) {

        var tns = 'MY_TASKS.';

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
            title: tns + 'FUTURE_TITLE',
            icon: 'fa-tasks',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            query: {}
        };

        function _getData() {
            return greyscaleTaskApi.myList().then(function (data) {
                return _.filter(data, function (item) {
                    var today = new Date();
                    var twoWeeks = new Date();
                    twoWeeks.setDate(twoWeeks.getDate() + 14);
                    var startDate = new Date(item.startDate);
                    return startDate > today && startDate < twoWeeks;
                });
            });
        }

        return _table;
    });
