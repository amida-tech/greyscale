/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyReviewCtrl', function (_, $scope, $state, $stateParams, $q, greyscaleSurveyApi, greyscaleTaskApi,
        greyscaleProfileSrv, greyscaleLanguageApi, greyscaleEntityTypeApi, greyscaleGlobals, greyscaleUtilsSrv,
        greyscaleUsers, greyscaleGroupApi, $log) {

        var data = {},
            _title = [],
            taskId = $stateParams.taskId,
            surveyId = $stateParams.id,
            reqs = {
                survey: greyscaleSurveyApi.get(surveyId),
                profile: greyscaleProfileSrv.getProfile(),
                languages: greyscaleLanguageApi.list(),
                essence: greyscaleEntityTypeApi.list({
                    tableName: 'SurveyAnswers'
                })
            };

        $scope.loading = true;
        $scope.model = {
            id: surveyId,
            title: '',
            surveyData: null,
            showDiscuss: false
        };

        if (!$scope.model.id) {
            $state.go('policy');
        }

        if (taskId) {
            reqs.task = greyscaleTaskApi.get(taskId);
        }

        $q.all(reqs)
            .then(function (resp) {
                var _user = resp.profile;

                data = {
                    survey: resp.survey,
                    userId: _user.id,
                    languages: resp.languages.plain(),
                    essenceId: resp.essence[0] ? resp.essence[0].id : null,
                    flags: {
                        allowEdit: !!resp.task
                    },
                    policy: {
                        id: resp.survey.policyId,
                        title: resp.survey.title,
                        section: resp.survey.section,
                        subsection: resp.survey.subsection,
                        number: resp.survey.number,
                        options: {
                            readonly: true,
                            isPolicy: true
                        },
                        surveyId: resp.survey.id,
                        answerId: resp.survey.id,
                        taskId: resp.task ? resp.task.id : null,
                        userId: _user.id,
                        sections: [],
                        attachments: resp.survey.attachments || []
                    },
                    task: resp.task,
                    collaborators: [],
                    user: _user
                };

                greyscaleUsers.get(data.survey.author).then(function (profile) {
                    data.policy.authorName = greyscaleUtilsSrv.getUserName(profile);
                });

                _separatePolicy(data);

                _title = [data.survey.title];
                return data;
            })
            .then(function(_data){
                return greyscaleUsers.get(_data.survey.author).then(function (profile) {
                    _data.policy.authorName = greyscaleUtilsSrv.getUserName(profile);
                    return _data;
                });
            })
            .then(function(_data){
                var _user = _data.user;

                return greyscaleGroupApi.list(_user.organizationId).then(function (groups) {
                    var i,
                        qty = groups.length,
                        members = [];

                    for (i = 0; i < qty; i++) {
                        if (_user.usergroupId.indexOf(groups[i].id) > -1) {
                            members = members.concat(groups[i].userIds);
                        }
                    }
                    _data.collaborators = _.uniq(members);

                    return _data;
                });
            })
            .finally(function () {
                $log.debug('collaborators ',data.collaborators);
                $scope.model.title = _title.join(' - ');
                $scope.model.surveyData = data;
                $scope.model.showDiscuss = true;
                $scope.loading = false;
            });

        function _separatePolicy(data) {
            var q,
                policyIdx = greyscaleGlobals.formBuilder.fieldTypes.indexOf('policy'),
                _survey = data.survey,
                _questions = [],
                _sections = [],
                qty = _survey.questions.length;

            for (q = 0; q < qty; q++) {
                if (_survey.questions[q].type === policyIdx) {
                    _sections.push(_survey.questions[q]);
                } else {
                    _questions.push(_survey.questions[q]);
                }
            }
            _survey.questions = _questions;
            data.policy.sections = _sections;
        }
    });
