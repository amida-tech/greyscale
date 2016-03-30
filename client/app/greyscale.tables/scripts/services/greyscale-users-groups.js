/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleUserGroupsTbl', function ($q, _, greyscaleGroupApi, greyscaleUtilsSrv) {

        var tns = 'USERS.GROUPS_MODAL.';

        var _fields = [{
            field: 'title',
            show: true,
            title: tns + 'NAME',
            sortable: 'title'
        }, {
            show: true,
            multiselect: true
        }];

        var _table = {
            dataFilter: {},
            title: '',
            cols: _fields,
            dataPromise: getData,
            pageLength: 10,
            multiselect: {},
        };

        function getData() {
            //var organizationId = _table.dataFilter.organizationId;
            //if (!organizationId) {
            //    return $q.reject('400');
            //}
            var reqs = {
                groups: greyscaleGroupApi.list()
            };

            return $q.all(reqs).then(function (promises) {
                    return promises.groups;
                })
                .then(_setSelected)
                .catch(errorHandler);

        }

        function _setSelected(groups) {
            var selectedIds = _table.dataFilter.selectedIds;
            _table.multiselect.setSelected(selectedIds);
            return groups;
        }

        function errorHandler(err, action) {
            var msg = _table.formTitle;
            if (action) {
                msg += ' ' + action;
            }
            msg += ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
