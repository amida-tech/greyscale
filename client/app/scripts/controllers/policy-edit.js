/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyEditCtrl', function ($q, _, $scope, $state, $stateParams, $timeout, greyscaleSurveyApi,
        Organization, greyscaleUtilsSrv, greyscaleGlobals, i18n, greyscaleProfileSrv, greyscaleUsers,
        greyscaleEntityTypeApi, greyscaleProductApi, greyscaleWebSocketSrv, $interval, greyscaleModalsSrv,
        greyscaleProductSrv, $window, $log) {

        var //projectId,
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
                id: surveyId * 1,
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
                tableName: (isPolicy ? 'Surveys' : 'SurveyAnswers')
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
            if ($scope.model.survey.id && !$scope.model.lock.locked) {
                _lockPolicy();
            }
        }, greyscaleGlobals.wsHeartbeatSec * 1000);

        var firstSave = $scope.$on(surveyEvents.builderFormSaved, function () {
            $scope.dataForm.$setDirty();
            $timeout(function () {
                $scope.$digest();
            });
            firstSave();
        });

        //button handlers
        $scope.save = function () {
            _save(true);
        };

        $scope.publish = function () {
            _save(false);
        };
        $scope.cancel = _goBack;

        //listeners for policy lock state
        greyscaleWebSocketSrv.on(wsEvents.policyLocked, _policyLocked);
        greyscaleWebSocketSrv.on(wsEvents.policyUnlocked, _policyUnlocked);

        var _destroy = $scope.$on('$destroy', function () {
            Organization.$lock = false;
            lAnswerDirty();
            $interval.cancel(hbPromise);
            _unlockPolicy();
            greyscaleWebSocketSrv.off(wsEvents.policyLocked, _policyLocked);
            greyscaleWebSocketSrv.off(wsEvents.policyUnlocked, _policyUnlocked);
            _destroy();
        });

        greyscaleProfileSrv.getProfile()
            .then(function (_user) {
                user = _user;
                _setAuthor(_user, $scope.model.policy);
                return _user;
            });

        if (surveyId) {
            Organization.$watch($scope, function () {
                //projectId = Organization.projectId;
                _loadData();
            });
        } else {
            _policiesGenerate($scope.model.policy.sections);
            $state.ext.surveyName = i18n.translate('SURVEYS.NEW_SURVEY');
            $scope.model.policy.options.canImport = true;
        }

        /* internal functions */

        function _recordIds() {
            return {
                surveyId: $scope.model.survey ? $scope.model.survey.id : surveyId
            };
        }

        function _isCurrentRecord(data) {
            var _policy = $scope.model.policy,
                _survey = $scope.model.survey;

            return data.policyId && _policy && data.policyId === _policy.id ||
                data.surveyId && _survey && data.surveyId === _survey.id;
        }

        function _lockPolicy() {
            greyscaleWebSocketSrv.emit(wsEvents.policyLock, _recordIds());
        }

        function _unlockPolicy() {
            greyscaleWebSocketSrv.emit(wsEvents.policyUnlock, _recordIds());
        }

        function _policyLocked(data) {
            angular.extend($scope.model.lock, data);
            if (!data.editor) {
                $log.warn('lock editor undefined!');
            }
            if (data.editor && data.editor !== user.id && _isCurrentRecord(data)) {
                $scope.model.lock.locked = true;
                greyscaleUsers.get(data.editor)
                    .then(function (user) {
                        $scope.model.lock.editorUser = user;
                    });
            }
        }

        function _policyUnlocked(data) {
            if (_isCurrentRecord(data)) {
                $scope.model.lock.locked = false;
                greyscaleUtilsSrv.successMsg('POLICY.UPDATED');
                _loadData();
            }
        }

        function _save(isDraft) {
            var _publish = $q.resolve(false),
                survey = $scope.model.survey,
                _deregistator = $scope.$on(greyscaleGlobals.events.survey.builderFormSaved, function () {
                    _deregistator();
                    if (!isDraft && greyscaleProductSrv.needAcionSecect(survey.product, survey.uoas)) {
                        _publish = greyscaleModalsSrv.dialog(dlgPublish);
                    }
                    _publish
                        .then(function (_action) {
                            return _saveSurvey(isDraft)
                                .then(function () {
                                    if (_action && greyscaleProductSrv.needAcionSecect(survey.product, survey.uoas)) {
                                        return greyscaleProductSrv.doAction(survey.product.id, survey.uoas[0], _action);
                                    } else {
                                        return true;
                                    }
                                });
                        })
                        .then(_goBack);
                });

            $timeout(function () {
                $scope.$broadcast(surveyEvents.extSave);
            });
        }

        function _loadData() {
            var params = {
                    forEdit: true
                },
                _policy = {};

            $scope.model.loading = true;

            greyscaleProductApi.getList({
                    surveyId: surveyId
                })
                .then(function (products) {
                    if (products && products.length) {
                        return greyscaleProductApi.product(products[0].id).tasksList();
                    }
                    return null;
                })
                .then(function (tasks) {
                    if (tasks && tasks.length) {
                        for (var i = 0; i < tasks.length; i++) {
                            if (tasks[i].status === 'current') {
                                return tasks[i].id;
                            }
                        }
                        return tasks[0].id;
                    }
                    return null;
                })
                .then(function (taskId) {
                    _policy.taskId = taskId;
                    return greyscaleSurveyApi.get(surveyId, params);
                })
                .then(function (survey) {
                    var _questions = [],
                        _sections = [],
                        qty = survey.questions ? survey.questions.length : 0,
                        q,
                        canImport = true;

                    isPolicy = (survey.policyId !== null);
                    survey.isPolicy = isPolicy;

                    if (isPolicy) {
                        _lockPolicy();

                        angular.extend(_policy, {
                            id: survey.policyId,
                            title: survey.title,
                            section: survey.section,
                            subsection: survey.subsection,
                            number: survey.number,
                            answerId: survey.id,
                            attachments: survey.attachments || [],
                            survey: $scope.model.survey,
                            version: survey.surveyVersion
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

                        angular.extend(_policy, {
                            sections: _sections,
                            options: {
                                canImport: canImport,
                                canComment: true, // let admins to comment policy
                                readonly: survey.locked,
                                surveyVersion: survey.surveyVersion,
                                isVersion: false
                            }
                        });
                    }

                    $state.ext.surveyName = survey ? survey.title : $state.ext.surveyName;

                    return greyscaleEntityTypeApi.list({
                        tableName: (isPolicy ? 'Surveys' : 'SurveyAnswers')
                    });
                })
                .then(function (essences) {
                    if (essences.length) {
                        _policy.essenceId = essences[0].id;
                    }
                    return ($scope.model.survey.author);
                })
                .then(function (user) {
                    _setAuthor(user, _policy);
                })
                .finally(function () {
                    $scope.model.policy = _policy;
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
            // _survey.projectId = projectId;
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

            _savePromise = (_survey.id ? greyscaleSurveyApi.update(_survey, params) : greyscaleSurveyApi.add(_survey,
                params));

            return _savePromise
                .catch(function (err) {
                    greyscaleUtilsSrv.apiErrorMessage(err, 'UPDATE', 'PRODUCTS.TABLE.POLICY');
                });
        }

        function _goBack() {
            $window.history.back();
            //$state.go('policy');
        }

        function _policiesGenerate(_sections) {
            var q = _sections.length;

            for (q; q < greyscaleGlobals.formBuilder.policyQty; q++) {
                if (q == 9) {
                    _sections.splice(2, 0, {
                        type: policyIdx,
                        surveyId: surveyId,
                        label: 'POLICY.SECTION_' + q,
                        description: ''
                    });
                } else
                    _sections.push({
                        type: policyIdx,
                        surveyId: surveyId,
                        label: 'POLICY.SECTION_' + q,
                        description: ''
                    });
            }
        }

        function _publishIsDisabled(dataForm) {
            /* disable if editing locked or invalid or public version and not changed */
            return $scope.model.lock.locked || dataForm.$invalid ||
                !!~($scope.model.survey.surveyVersion) && dataForm.$pristine;
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

        function _setAuthor(profile, policy) {
            if (profile && policy) {
                policy.author = profile.id;
                policy.authorName = profile.fullName || (profile.firstName + ' ' + profile.lastName);
            }
            return profile;
        }

        /* end of internal functions */
    });
