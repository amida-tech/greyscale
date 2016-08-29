/**
 * Created by igi on 25.08.16.
 */
'use strict';

angular.module('greyscale.core')
    .service('greyscaleProductSrv', function ($q, _, greyscaleGlobals, greyscaleProductApi) {
        var actions = greyscaleGlobals.productActions,
            statuses = greyscaleGlobals.productStates,
            activeStatuses = greyscaleGlobals.productActiveStates;

        return {
            needAcionSecect: _needAction,
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

            return params ? productApi.taskMove(uoaId, params) : $q.reject('incorrect action');
        }

        function _needAction(product, uoas) {
            var _state = _.find(statuses, {id: product.status});
            return product && product.id && uoas && uoas[0] &&
                _state && !!~activeStatuses.indexOf(_state.id);
        }
    });
