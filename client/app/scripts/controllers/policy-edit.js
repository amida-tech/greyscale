/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyEditCtrl', function (_, $scope, $state, $stateParams, $timeout, greyscaleSurveyApi,
        Organization, greyscaleUtilsSrv, greyscaleGlobals, i18n, greyscaleProfileSrv, greyscaleUsers,
        greyscaleEntityTypeApi, greyscaleProductApi, greyscaleWebSocketSrv, $interval, greyscaleModalsSrv, $log) {

        var projectId,
            policyIdx = greyscaleGlobals.formBuilder.fieldTypes.indexOf('policy'),
            surveyId = $stateParams.id === 'new' ? null : $stateParams.id,
            dlgPublish = greyscaleGlobals.dialogs.policyPublish;

        var isPolicy = true;
        var wsEvents = greyscaleGlobals.events.ws,
            surveyEvents = greyscaleGlobals.events.survey;
        var user = {
            id: -1
        };

        var lAnswerDirty,
            hbPromise;

        Organization.$lock = true;

        $scope.model = {
            loading: false,
            lock: {
                locked: false,
                editor: -1,
                tsLock: NaN,
                editorUser: {}
            },
            survey: {
                isPolicy: isPolicy,
                author: -1
            },
            policy: {
                id: null,
                title: '',
                section: '',
                subsection: '',
                number: '',
                author: -1,
                authorName: '',
                essenceId: -1,
                options: {
                    readonly: false,
                    canImport: false
                },
                sections: [],
                attachments: []
            }
        };

        $scope.publishIsDisabled = _publishIsDisabled;

        greyscaleEntityTypeApi.list({
                tableName: (isPolicy ? 'Policies' : 'SurveyAnswers')
            })
            .then(function (essences) {
                if (essences.length) {
                    $scope.model.policy.essenceId = essences[0].id;
                }
            });

        lAnswerDirty = $scope.$on(surveyEvents.answerDirty, function () {
            $scope.dataForm.$setDirty();
        });

        hbPromise = $interval(function () {
            if ($scope.model.survey.isPolicy && $scope.model.survey.policyId && !$scope.model.lock.locked) {
                _lockPolicy($scope.model.survey.policyId);
            }
        }, greyscaleGlobals.wsHeartbeatSec * 1000);

        //button handlers
        $scope.save = _saveClick;
        $scope.cancel = _goPolicyList;
        $scope.publish = _publish;

        //listeners for policy lock state
        greyscaleWebSocketSrv.on(wsEvents.policyLocked, _policyLocked);
        greyscaleWebSocketSrv.on(wsEvents.policyUnlocked, _policyUnlocked);

        var _destroy = $scope.$on('$destroy', function () {
            Organization.$lock = false;
            lAnswerDirty();
            $interval.cancel(hbPromise);
            _unlockPolicy($scope.model.survey.policyId);
            greyscaleWebSocketSrv.off(wsEvents.policyLocked, _policyLocked);
            greyscaleWebSocketSrv.off(wsEvents.policyUnlocked, _policyUnlocked);
            _destroy();
        });

        greyscaleProfileSrv.getProfile()
            .then(function (_user) {
                user = _user;
                return _user;
            })
            .then(_setAuthor);

        if (surveyId) {
            $scope.model.loading = true;
            Organization.$watch($scope, function () {
                projectId = Organization.projectId;
                _loadSurvey();
            });
        } else {
            _policiesGenerate($scope.model.policy.sections);
            $state.ext.surveyName = i18n.translate('SURVEYS.NEW_SURVEY');
            $scope.model.policy.options.canImport = true;
        }

        function _lockPolicy(policyId) {
            greyscaleWebSocketSrv.emit(wsEvents.policyLock, {
                policyId: policyId
            });
        }

        function _unlockPolicy(policyId) {
            greyscaleWebSocketSrv.emit(wsEvents.policyUnlock, {
                policyId: policyId
            });
        }

        function _policyLocked(data) {
            angular.extend($scope.model.lock, data);
            $scope.model.lock.locked = (data.editor !== user.id);
            greyscaleUsers.get(data.editor)
                .then(function (user) {
                    $scope.model.lock.editorUser = user;
                });

        }

        function _policyUnlocked(data) {
            $scope.model.lock.locked = (data.policyId === $scope.model.survey.policyId);
        }
        /* re-factor */
        $scope.save = function () {
            _save(true);
        };

        $scope.cancel = _goPolicyList;

        $scope.publish = function () {
            _save(false);
        };

        function _save(isDraft) {
            var _publish = $q.resolve(false),
                _deregistator = $scope.$on(greyscaleGlobals.events.survey.builderFormSaved, function () {
                    _deregistator();
                    if (!isDraft) {
                        _publish = greyscaleModalsSrv.dialog(dlgPublish);
                    }
                    _publish
                        .then(function (_action) {
                            return _saveSurvey(isDraft)
                                .then(function () {
                                    return greyscaleSurveySrv.doAction($scope.model.survey, _action);
                                });
                        })
                        .then(_goPolicyList);

                });
            $scope.saveFormbuilder();
        }
        /* end re-factor */

        function _loadSurvey() {
            var params = {
                forEdit: true
            };

            greyscaleProductApi.getList({
                surveyId: surveyId
            }).then(function (products) {
                if (!products || !products.length) {
                    return;
                }
                var product = products[0];

                greyscaleProductApi.product(product.id).tasksList().then(function (tasks) {
                    if (!tasks || !tasks.length) {
                        return;
                    }

                    for (var i = 0; i < tasks.length; i++) {
                        if (tasks[i].status !== 'current') {
                            continue;
                        }
                        $scope.model.policy.taskId = tasks[i].id;
                        break;
                    }
                });
            });

            greyscaleSurveyApi.get(surveyId, params)
                .then(function (survey) {
                    var _questions = [],
                        _sections = [],
                        qty = survey.questions ? survey.questions.length : 0,
                        q,
                        canImport = true;

                    isPolicy = (survey.policyId !== null);
                    survey.isPolicy = isPolicy;

                    if (isPolicy) {
                        _lockPolicy(survey.policyId);

                        angular.extend($scope.model.policy, {
                            id: survey.policyId,
                            title: survey.title,
                            section: survey.section,
                            subsection: survey.subsection,
                            number: survey.number,
                            answerId: survey.policyId,
                            attachments: survey.attachments || []
                        });

                        for (q = 0; q < qty; q++) {
                            if (survey.questions[q].type === policyIdx) {
                                _sections.push(survey.questions[q]);
                                canImport = canImport && (!survey.questions[q].description);
                            } else {
                                _questions.push(survey.questions[q]);
                            }
                        }

                        survey.questions = _questions;
                        angular.extend($scope.model.survey, survey);

                        _policiesGenerate(_sections);
                        angular.extend($scope.model.policy, {
                            sections: _sections,
                            options: {
                                canImport: canImport,
                                readonly: survey.locked
                            }
                        });
                    }
                    $state.ext.surveyName = survey ? survey.title : $state.ext.surveyName;

                    if (projectId !== survey.projectId) {
                        Organization.$setBy('projectId', survey.projectId);
                    }

                    return greyscaleEntityTypeApi.list({
                        tableName: (isPolicy ? 'Policies' : 'SurveyAnswers')
                    });
                })
                .then(function (essences) {
                    if (essences.length) {
                        $scope.model.policy.essenceId = essences[0].id;
                    }
                    return ($scope.model.survey.author) ? greyscaleUsers.get($scope.model.survey.author) : false;
                })
                .then(_setAuthor)
                .finally(function () {
                    $scope.model.loading = false;
                });
        }

        function _saveSurvey(isDraft) {
            var _survey,
                _policy = $scope.model.policy,
                params = {},
                _savePromise;

            if (isDraft) {
                params.draft = true;
            }
            _survey = angular.extend({}, $scope.model.survey);
            _survey.projectId = projectId;
            _survey.isPolicy = true;

            if (surveyId) {
                _survey.id = surveyId;
            }
            angular.extend(_survey, {
                socketId: greyscaleWebSocketSrv.id(),
                policyId: _policy.id,
                title: _policy.title,
                section: _policy.section,
                subsection: _policy.subsection,
                number: _policy.number,
                author: _policy.author,
                attachments: _.map(_policy.attachments, 'id')
            });

            _reinitPolicySections($scope.model.policy.sections);

            if (_survey.questions) {
                _survey.questions = _survey.questions.concat($scope.model.policy.sections);
            } else {
                _survey.questions = $scope.model.policy.sections;
            }

            _savePromise = (_survey.id ? greyscaleSurveyApi.update(_survey, params) : greyscaleSurveyApi.add(_survey, params));

            return _savePromise
                .catch(function (err) {
                    greyscaleUtilsSrv.errorMsg(err, 'ERROR.SURVEY_UPDATE_ERROR');
                });
        }

        var firstSave = $scope.$on(surveyEvents.builderFormSaved, function () {
            $scope.dataForm.$dirty = true;
            $timeout(function () {
                $scope.$digest();
            });
            firstSave();
        });

        function _saveClick() {
            var _deregistator = $scope.$on(surveyEvents.builderFormSaved, function () {
                _deregistator();
                _save();
            });
            $timeout(function () {
                $scope.$broadcast(surveyEvents.extSave);
            });
        }

        function _goPolicyList() {
            $state.go('policy');
        }

        function _policiesGenerate(_sections) {
            var q = _sections.length;

            for (q; q < greyscaleGlobals.formBuilder.policyQty; q++) {
                _sections.push({
                    type: policyIdx,
                    surveyId: surveyId,
                    label: 'POLICY.SECTION_' + q,
                    description: ''
                });
            }
        }

        function _publishIsDisabled(dataForm) {
            /* don't need
             if (surveyId && dataForm.$pristine) {
                 return false;
             }
             */
            return dataForm.$invalid || !!~($scope.model.survey.surveyVersion);
        }

        function _reinitPolicySections(sections) {
            var i,
                qty = sections.length;

            for (i = 0; i < qty; i++) {
                angular.extend(sections[i], {
                    type: policyIdx,
                    surveyId: surveyId
                });
            }
        }

        function _setAuthor(profile) {
            if (profile) {
                $scope.model.policy.author = profile.id;
                $scope.model.policy.authorName = profile.fullName;
            }
            return profile;
        }
    });
