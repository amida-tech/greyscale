/**
 * Created by igi on 18.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleWorkflowStepsApi', function (greyscaleRestSrv, $q) {
        var _api = function () {
            return greyscaleRestSrv().one('workflow_steps');
        };

        var _list = function (params) {
            return _api().get(params)
                .catch(function(){
                    return $q.when([
                        {id: 1, name: 'step1', description: 'Do step1!'},
                        {id: 2, name: 'step2', description: 'Do step2!'},
                        {id: 3, name: 'step3', description: 'Do step3!'},
                        {id: 4, name: 'step4', description: 'Do step4!'},
                        {id: 5, name: 'step5', description: 'Do step5!'},
                        {id: 6, name: 'step6', description: 'Do step6!'}
                    ]);
                });
        };

        var _add = function (body) {
            return _api().customPOST(body);
        };

        var _getOne = function (id) {
            return _api().one(id + '').get();
        };

        var _update = function (body) {
            return _api().one(body.id + '').customPUT(body);
        };

        var _delete = function (id) {
            return _api().one(id + '').remove();
        };

        return {
            list: _list,
            add: _add,
            get: _getOne,
            update: _update,
            delete: _delete
        };
    });
