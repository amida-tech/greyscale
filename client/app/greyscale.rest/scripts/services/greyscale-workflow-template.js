/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleWorkflowTemplateApi', function (greyscaleRestSrv) {
        return {
            list: _list,
            add: _add,
            update: _update,
            remove: _remove
        };

        function _api() {
            return greyscaleRestSrv.api().one('workflow_templates');
        }

        function _add(workflowTemplate) {
            return _api().customPOST(workflowTemplate).then(_postProc);
        }

        function _update(workflowTemplate) {
            return _api().one(workflowTemplate.id + '').customPUT(workflowTemplate).then(_postProc);
        }

        function _remove(id) {
            return _api().one(id + '').remove().then(_postProc);
        }

        function _list(params) {
            return _api().get(params).then(_postProc)
                .catch(function () {
                    return [{
                        id: 1,
                        workflow: {
                            name: 'fake template 1',
                            description: 'this is a fake template number 1'
                        },
                        steps: [{
                            allowEdit: false,
                            allowTranslate: false,
                            blindReview: false,
                            discussionParticipation: true,
                            position: 0,
                            provideResponses: false,
                            seeOthersResponses: false,
                            role: 'fake role 1',
                            title: 'fake step 1',
                            usergroupId: [5],
                            writeToAnswers: true
                        }, {
                            allowEdit: false,
                            allowTranslate: false,
                            blindReview: false,
                            discussionParticipation: true,
                            position: 1,
                            provideResponses: false,
                            seeOthersResponses: false,
                            role: 'fake role 2',
                            title: 'fake step 2',
                            usergroupId: [6],
                            writeToAnswers: true
                        }]
                    }, {
                        id: 2,
                        workflow: {
                            name: 'fake template 2',
                            description: 'this is a fake template number 2'
                        },
                        steps: [{
                            allowEdit: false,
                            allowTranslate: false,
                            blindReview: false,
                            discussionParticipation: true,
                            position: 0,
                            provideResponses: false,
                            seeOthersResponses: false,
                            role: 'fake role 1',
                            title: 'fake step 1',
                            usergroupId: [1],
                            writeToAnswers: true
                        }, {
                            allowEdit: false,
                            allowTranslate: false,
                            blindReview: false,
                            discussionParticipation: true,
                            position: 1,
                            provideResponses: false,
                            seeOthersResponses: false,
                            role: 'fake role 2',
                            title: 'fake step 2',
                            usergroupId: [1],
                            writeToAnswers: true
                        }]
                    }];
                });
        }

        function _postProc(resp) {
            return (resp) ? resp.plain() : resp;
        }
    });
