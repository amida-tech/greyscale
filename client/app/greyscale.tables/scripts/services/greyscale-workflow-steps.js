/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleWorkflowStepsTbl', function ($q, greyscaleModalsSrv, greyscaleUtilsSrv, greyscaleWorkflowStepsApi) {

        var recDescr = [{
            field: 'id',
            show: true,
            sortable: 'id',
            title: 'ID',
            dataFormat: 'text',
            dataReadOnly: 'both'
        }, {
            field: 'title',
            show: true,
            sortable: false,
            title: 'Title',
            dataFormat: 'text'
        }, {
            field: 'description',
            show: true,
            sortable: false,
            title: 'Description',
            dataFormat: 'textarea'
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                class: 'info',
                handler: _editWorkflow
            }, {
                icon: 'fa-trash',
                class: 'danger',
                handler: _delRecord
            }]
        }];

        var _table = {
            formTitle: 'Workflow Step',
            title: 'Workflow Steps',
            icon: 'fa-fast-forward',
            pageLength: 10,
            cols: recDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _editWorkflow
            }
        };

        function _getData() {
            return greyscaleWorkflowStepsApi.list();
        }

        function _delRecord(item) {
            greyscaleWorkflowStepsApi.delete(item.id)
                .then(reloadTable)
                .catch(function (err) {
                    errHandler(err, 'deleting');
                });
        }

        function _editWorkflow(step) {
            var op = 'editing';
            greyscaleModalsSrv.editRec(step, _table)
                .then(function (newPrj) {
                    if (newPrj.id) {
                        return greyscaleWorkflowStepsApi.update(newPrj);
                    } else {
                        op = 'adding';
                        return greyscaleWorkflowStepsApi.add(newPrj);
                    }
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function reloadTable() {
            _table.tableParams.reload();
        }

        function errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
