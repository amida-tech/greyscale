/**
 * Created by igi on 25.08.16.
 */
'use strict';

angular.module('greyscale.core')
    .service('greyscaleProductSrv', function ($q, _, greyscaleGlobals, greyscaleProductApi, $log) {
        var actions = greyscaleGlobals.productActions;

        return {
            doAction: _doAction
        };

        function _doAction(productId, uoaId, _action) {
            var productApi = greyscaleProductApi.product(productId),
                params, a;

            for (a in actions) {
                if (actions.hasOwnProperty(a) && actions[a] === _action) {
                    params = {};
                    params[_action] = true;
                }
            }
            $log.debug('product action', _action, params);

            return params ? productApi.taskMove(uoaId, params) : $q.reject('incorrect action');
        }
    });
