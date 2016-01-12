/**
 * Created by igi on 28.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('GreyscaleTable', function ($q, $injector, $log, greyscaleUtilsSrv, greyscaleModalsSrv) {
        function GreyscaleTable(table, dataService) {

            this.dataService = $injector.get(dataService);

            angular.extend(this, {
                dataFilter: {},
                title: '',
                formTitle: '',
                icon: 'fa-table',
                cols: [],
                dataPromise: this.getData,
                pageLength: 5,
                add: null
            });

            angular.extend(this, table);

            for (var c = 0; this.cols.length; c++) {
                var field = this.cols[c];
                switch (field.dataFormat) {
                    case 'option':
                        break;
                    case 'action':
                        break;
                }
                if (field) {

                }
            }
        }

        GreyscaleTable.prototype.reload = function () {
            if (this._table && this._table.tableParams) {
                this._table.tableParams.reload();
            }
        };

        GreyscaleTable.prototype.getData = function () {
            $q.reject('has to be defined');
        };

        GreyscaleTable.prototype.editRecord = function (rec) {
            var action = rec ? 'editing' : 'adding';
            var self = this;

            if (!rec) {
                rec = {};
            }
            rec = angular.extend(rec, self._table.dataFilter);

            return greyscaleModalsSrv.editRec(rec, self._table)
                .then(function (newRec) {
                    if (action === 'editing') {
                        return self.dataService.update(newRec);
                    } else {
                        return self.dataService.add(newRec);
                    }
                })
                .then(self.reload)
                .catch(function (err) {
                    self.errorHandler(err, action);
                });
        };


        GreyscaleTable.prototype.deleteRecord = function (rec) {
            var self = this;
            self.dataService.delete(rec.id)
                .then(self.reload)
                .catch(function (err) {
                    self.errorHandler(err, 'deleting');
                });
        };

        GreyscaleTable.prototype.errorHandler = function (err, action) {
            var msg = _table.formTitle;
            if (action) {
                msg += ' ' + action;
            }
            msg += ' error';
            greyscaleUtilsSrv.errorMsg(err, msg)
        };

        return GreyscaleTable;
    });
