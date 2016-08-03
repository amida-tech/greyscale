'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleMyTasksTbl', function (_, greyscaleTaskApi, greyscaleProfileSrv, greyscaleGlobals, $log) {

        var tns = 'MY_TASKS.',
            _userId,
            _userStatuses = greyscaleGlobals.policy.userStatuses;

        var resDescr = [{
            title: tns + 'TASK',
            show: true,
            cellTemplateUrl: 'my-tasks-cell-task.html'
        }, {
            title: tns + 'SURVEY_POLICY',
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

        greyscaleProfileSrv.getProfile().then(function (_profile) {
            _userId = _profile.id;
        });

        return {
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
            return greyscaleTaskApi.myList().then(function (data) {
                return _.filter(data, function (item) {
                    var res = item.status === 'current',
                        userStatus;

                    if (res) {
                        item.approved = (item.userStatus && item.userStatus === _userStatuses.approved);
                        $log.debug('my task filter', item, item.approved);
                    }
                    return res;
                });
            });
        }
    });
