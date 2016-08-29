/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyReviewCtrl', function (_, $scope, $state, $stateParams, $q, greyscaleSurveyApi, greyscaleTaskApi,
        greyscaleProfileSrv, greyscaleLanguageApi, greyscaleEntityTypeApi, greyscaleGlobals, greyscaleUtilsSrv,
        greyscaleUsers, greyscaleGroupApi, greyscaleCommentApi) {

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
            isTaskMode: !!taskId
        };

        if (!$scope.model.id) {
            $state.go('policy');
        }

        if (taskId) {
            reqs.task = greyscaleTaskApi.get(taskId)
                .then(_startTask);
        }

        $q.all(reqs)
            .then(function (resp) {
                var _user = resp.profile,
                    g, qty;

                data = {
                    survey: resp.survey,
                    userId: _user.id,
                    languages: resp.languages,
                    essenceId: resp.essence[0] ? resp.essence[0].id : null,
                    flags: {
                        allowEdit: !!resp.task
                    },
                    policy: {
                        id: resp.survey.policyId,
                        author: resp.survey.author,
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
                    collaboratorIds: [],
                    collaborators: {},
                    user: _user,
                    resolveModeIsDisabled: true
                };

                if (resp.task) {
                    $scope.model.isTaskMode = !!~resp.task.userIds.indexOf(_user.id);
                    qty = _user.usergroupId.length;
                    for (g = 0; !$scope.model.isTaskMode && g < qty; g++) {
                        $scope.model.isTaskMode = $scope.model.isTaskMode ||
                            !!~resp.task.groupIds.indexOf(_user.usergroupId[g]);
                    }

                    if ($scope.model.isTaskMode) {
                        data.task = resp.task;
                    }
                }
                _separatePolicy(data);

                _title = [data.survey.title];
                return data;
            })
            .then(function (_data) {
                return greyscaleUsers.get(_data.survey.author).then(function (profile) {
                    _data.policy.authorName = greyscaleUtilsSrv.getUserName(profile);
                    return _data;
                });
            })
            .then(function (_data) {
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
                    _data.collaboratorIds = _.uniq(members);
                    if (_data.task) {
                        greyscaleCommentApi.getUsers(_data.task.id)
                            .then(function (commentData) {
                                var _u,
                                    _usr,
                                    _qty = commentData.users.length;

                                for (_u = 0; _u < _qty; _u++) {
                                    _usr = _.pick(commentData.users[_u], ['userId', 'firstName', 'lastName']);
                                    _usr.fullName = greyscaleUtilsSrv.getUserName(commentData.users[_u]);
                                    _data.collaborators[commentData.users[_u].userId] = _usr;
                                }
                            });
                    }
                    return _data;
                });
            })
            .finally(function () {
                $scope.model.title = _title.join(' - ');
                $scope.model.surveyData = data;
                $scope.loading = false;
            });

        function _separatePolicy(data) {
            var q,
                policyIdx = greyscaleGlobals.formBuilder.fieldTypes.indexOf('policy'),
                _survey = data.survey,
                _questions = [],
                _sections = [],
                qty = _survey && _survey.questions ? _survey.questions.length : -1;

            for (q = 0; q < qty; q++) {
                _survey.questions[q].canComment = $scope.model.isTaskMode;
                if (_survey.questions[q].type === policyIdx) {
                    _sections.push(_survey.questions[q]);
                } else {
                    _questions.push(_survey.questions[q]);
                }
            }
            _survey.questions = _questions;
            data.policy.sections = _sections;
        }

        function _startTask(task) {
            return greyscaleTaskApi.state(task.id, 'start')
                .then(function () {
                    return task;
                })
                .catch(function (err) {
                    greyscaleUtilsSrv.errorMsg(err);
                    return task;
                });
        }
    });
