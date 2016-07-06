/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleWorkflowTemplateApi', function (greyscaleRestSrv) {
        return {
            list: _list,
            add: _add,
            remove: _remove
        };

        function _api() {
            return greyscaleRestSrv().one('workflow_templates');
        }

        function _add(workflowTemplate) {
            return _api().customPUT(workflowTemplate).then(_postProc);
        }

        function _remove(id) {
            return _api().one(id + '').remove().then(_postProc);
        }

        function _list(params) {
            return _api().get(params).then(_postProc)
                .catch(function () {
                    return [{
                        id: 1,
                        title: 'fake template 1'
                    }, {
                        id: 2,
                        title: 'fake template 2'
                    }, {
                        id: 3,
                        title: 'fake template 3'
                    }, {
                        id: 4,
                        title: 'fake template 4'
                    }, {
                        id: 5,
                        title: 'fake template 5'
                    }, {
                        id: 6,
                        title: 'fake template 6'
                    }];
                });
        }

        function _postProc(resp) {
            return (resp) ? resp.plain() : resp;
        }
    });
