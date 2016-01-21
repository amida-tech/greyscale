'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleProductUoasTbl', function ($q,
                                                  _,
                                                  greyscaleProfileSrv,
                                                  greyscaleProductApi,
                                                  greyscaleUoaTypeApi,
                                                  greyscaleUtilsSrv,
                                                  greyscaleModalsSrv,
                                                  greyscaleLanguageApi) {

        var dicts = {
            languages: [],
            uoaTypes: []
        };

        var resDescr = [{
                field: 'name',
                title: 'Name',
                show: true,
                sortable: 'name'
            }, {
                field: 'description',
                title: 'Description',
                show: true,
                dataFormat: 'text'
            }, {
                field: 'shortName',
                title: 'Short Name',
                show: true
            },
            /*
             field: 'HASC',
             */
            {
                field: 'unitOfAnalysisType',
                title: 'Type',
                show: true,
                sortable: 'unitOfAnalysisType',
                dataFormat: 'option',
                dataSet: {
                    getData: getUoaTypes,
                    keyField: 'id',
                    valField: 'name'
                }
            }, {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [{
                    icon: 'fa-trash',
                    class: 'danger',
                    handler: _delRecord
                }]
            }];

        var _table = {
            title: 'Product Units of Analysis',
            icon: 'fa-table',
            dataFilter: {},
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _addUoa
            }
        };

        function _addUoa() {
            return greyscaleModalsSrv.uoasFilter()
            .then(function(uoasIds){
                uoasIds = _filterUoasDuplicates(uoasIds);
                return _saveNewUoasToProduct(uoasIds);
            })
            .then(_reloadTable)    ;
        }

        function _getProductId() {
            return _table.dataFilter.productId;
        }

        function _getData() {

            if (!_getProductId()) {
                return $q.reject();
            }

            return greyscaleProfileSrv.getProfile().then(function () {
                var productId = _getProductId();
                var req = {
                    uoas: greyscaleProductApi.product(productId).uoasList(),
                    uoaTypes: greyscaleUoaTypeApi.list(),
                    languages: greyscaleLanguageApi.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoas.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoas, resDescr);
                    }
                    dicts.languages = promises.languages;
                    dicts.uoaTypes = promises.uoaTypes;

                    return promises.uoas;
                });
            });
        }

        function _reloadTable() {
            _table.tableParams.reload();
        }

        function _delRecord(uoa) {
            var productId = _getProductId();
            greyscaleProductApi.product(productId).uoasDel(uoa.id)
                .then(_reloadTable)
                .catch(function (err) {
                    errHandler(err, 'deleting');
                });
        }

        function getUoaTypes() {
            return dicts.uoaTypes;
        }

        function errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        function _filterUoasDuplicates(uoasIds) {
            return _.difference(uoasIds, _table.dataMap);
        }

        function _saveNewUoasToProduct(uoasIds) {
            var productId = _getProductId();
            return greyscaleProductApi.product(productId).uoasAddBulk(uoasIds);
        }

        return _table;
    });
