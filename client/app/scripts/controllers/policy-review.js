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
            version = $stateParams.version,
            isVersion = ($state.current.name === 'policy.version'),
            reqs = {
                survey: (version ? greyscaleSurveyApi.getVersion(surveyId, version) : greyscaleSurveyApi.get(surveyId)),
                profile: greyscaleProfileSrv.getProfile('force'),
                languages: greyscaleLanguageApi.list(),
                essence: greyscaleEntityTypeApi.list({
                    tableName: 'SurveyAnswers'
                })
            },
            options = {
                isPolicy: true,
                isVersion: isVersion,
                readonly: true,
                review: true
            };

        $scope.loading = true;
        $scope.model = {
            id: surveyId,
            title: '',
            surveyData: null,
            isTaskMode: !!taskId,
            isVersion: isVersion
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

                if (isVersion && !version) {
                    version = resp.survey.surveyVersion;
                }

                data = {
                    survey: resp.survey,
                    userId: _user.id,
                    languages: resp.languages,
                    essenceId: resp.essence[0] ? resp.essence[0].id : null,
                    flags: {
                        allowEdit: !!resp.task,
                        isVersion: isVersion
                    },
                    policy: {
                        id: resp.survey.policyId,
                        author: resp.survey.author,
                        authorName: greyscaleUtilsSrv.getUserName(resp.survey.author),
                        title: resp.survey.title,
                        section: resp.survey.section,
                        subsection: resp.survey.subsection,
                        number: resp.survey.number,
                        options: options,
                        survey: resp.survey,
                        surveyId: resp.survey.id,
                        answerId: resp.survey.id,
                        taskId: resp.task ? resp.task.id : null,
                        userId: _user.id,
                        sections: [],
                        attachments: resp.survey.attachments || [],
                        version: resp.survey.surveyVersion
                    },
                    collaboratorIds: [],
                    collaborators: {},
                    user: _user
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
                } else {
                    data.task = {
                        productId: resp.survey.product.id,
                        uoaId: resp.survey.uoas[0]
                    };
                }
                _separatePolicy(data);

                _title = [data.survey.title];
                return data;
            })
            .then(function (_data) {
                var _user = _data.user,
                    _policy = _data.policy,
                    _req = {
                        groups: greyscaleGroupApi.list(_user.organizationId)
                    };

                if (_data.task && _data.task.userStatuses) {
                    _req.users = greyscaleCommentApi.getUsers(_data.task.id);
                } else {
                    _req.users = greyscaleSurveyApi.versionUsers(
                        _policy.surveyId,
                        _policy.version, {
                            uoaId: _data.survey.uoas[0]
                        });
                }

                return $q.all(_req).then(function (resp) {
                    var i,
                        qty = resp.groups.length,
                        members = [];

                    for (i = 0; i < qty; i++) {
                        if (~_user.usergroupId.indexOf(resp.groups[i].id)) {
                            members = members.concat(resp.groups[i].userIds);
                        }
                    }
                    _data.collaboratorIds = _.uniq(members);

                    if (resp.users && resp.users.users) { //fix users link
                        resp.users = resp.users.users;
                    }
                    var _u,
                        _usr,
                        _qty = resp.users.length;

                    for (_u = 0; _u < _qty; _u++) {
                        _usr = _.pick(resp.users[_u], ['userId', 'firstName', 'lastName']);
                        _usr.fullName = greyscaleUtilsSrv.getUserName(_usr);
                        _data.collaborators[_usr.userId] = _usr;
                    }
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
                    greyscaleUtilsSrv.apiErrorMessage(err, 'START_TASK');
                    return task;
                });
        }
    });
