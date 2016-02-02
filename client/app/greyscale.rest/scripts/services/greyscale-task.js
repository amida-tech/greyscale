'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleTaskApi', function (greyscaleRestSrv, $q) {
        function api() {
            return greyscaleRestSrv().one('get_my_tasks');
        }

        function _list(params) {

            var mock = [{
                title: 'Easy task for you',
                description: 'Could you call nine one one, please.',
                project: {
                    name: 'da roof is on fire'
                },
                product: {
                    name: 'SOS'
                },
                step:  {
                    id: 3,
                    title: 'Think twice!!',
                    description: 'keep calm and relax',
                    workflowId: 6,
                    stepId: 9,
                    startDate: '2015-10-23T12:00:00.000Z',
                    endDate: '2016-03-11T21:00:00.000Z',
                    roleId: null
                }
            }, {
                title: 'Hard task for you',
                description: 'English, do you speak it?',
                project: {
                    name: 'da roof is on fire'
                },
                product: {
                    name: '!@#$%^&*'
                },
                step:  {
                    id: 4,
                    title: 'Watch your step',
                    description: 'try walk in my shoes',
                    workflowId: 6,
                    stepId: 11,
                    startDate: '2015-10-23T12:00:00.000Z',
                    endDate: '2015-12-23T21:00:00.000Z',
                    roleId: null
                }
            }];

            return api().get(params)
                .catch(function(){
                    return $q.when(mock);
                });
        }

        return {
            list: _list
        };
    });
