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

        var tns = 'PRODUCTS.UOAS.';

        var dicts = {
            languages: [],
            uoaTypes: []
        };

        var resDescr = [{
                field: 'name',
                title: tns + 'NAME',
                show: true,
                sortable: 'name'
            }, {
                field: 'description',
                title: tns + 'DESCRIPTION',
                show: true,
                dataFormat: 'text'
            }, {
                field: 'shortName',
                title: tns + 'SHORT_NAME',
                show: true
            },
            /*
             field: 'HASC',
             */
            {
                field: 'unitOfAnalysisType',
                title: tns + 'TYPE',
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
                    tooltip: 'COMMON.DELETE',
                    handler: _delRecord
                }]
            }
        ];

        var _table = {
            title: tns + 'TABLE_TITLE',
            icon: 'fa-table',
            dataFilter: {},
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            add: {
                handler: _addUoa
            }
        };

        function _addUoa() {
            return greyscaleModalsSrv.uoasFilter()
                .then(function (uoasIds) {
                    uoasIds = _filterUoasDuplicates(uoasIds);
                    return _saveNewUoasToProduct(uoasIds);
                })
                .then(_reloadTable);
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
                    product: greyscaleProductApi.get(productId),
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
                    dicts.product = promises.product;

                    return promises.uoas;
                });
            });
        }

        function _reloadTable() {
            _table.tableParams.reload();
        }

        function _delRecord(uoa) {
            var productId = _getProductId();

            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                uoa: uoa,
                product: dicts.product,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleProductApi.product(productId).uoasDel(uoa.id)
                    .then(_reloadTable)
                    .catch(function (err) {
                        errHandler(err, 'deleting');
                    });
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
