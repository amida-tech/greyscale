/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('PolicyEditCtrl', function (_, $scope, $state, $stateParams, $timeout, greyscaleSurveyApi,
        Organization, greyscaleUtilsSrv, greyscaleGlobals, i18n, greyscaleProfileSrv, greyscaleUsers,
        greyscaleEntityTypeApi, greyscaleWebSocketSrv) {

        var projectId,
            policyIdx = greyscaleGlobals.formBuilder.fieldTypes.indexOf('policy'),
            surveyId = $stateParams.id === 'new' ? null : $stateParams.id;

        var isPolicy = true;
        var wsEvents = greyscaleGlobals.events.webSocket,
            surveyEvents = greyscaleGlobals.events.survey;
        var user = {
            id: -1
        };

        var lAnswerDirty;

        Organization.$lock = true;

        $scope.model = {
            loading: false,
            survey: {
                isPolicy: isPolicy,
                isDraft: true,
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

        lAnswerDirty = $scope.$on(surveyEvents.answerDirty, function () {
            $scope.dataForm.$setDirty();
        });

        //button handlers
        $scope.save = _saveClick;
        $scope.cancel = _goPolicyList;
        $scope.publish = _publish;

        //listeners for policy lock state
        greyscaleWebSocketSrv.on(wsEvents.policyLocked, function (data) {
            greyscaleUtilsSrv.errorMsg(JSON.stringify(data));
            $scope.model.policy.options.readonly = (data.editor !== user.id);
        });

        greyscaleWebSocketSrv.on(wsEvents.policyUnlocked, function (data) {
            greyscaleUtilsSrv.errorMsg(JSON.stringify(data));
            $scope.model.policy.options.readonly = false;
        });

        $scope.$on('$destroy', function () {
            Organization.$lock = false;
            lAnswerDirty();
        });

        if (surveyId) {
            $scope.model.loading = true;
            Organization.$watch($scope, function () {
                projectId = Organization.projectId;
                _loadSurvey();
            });
        } else {
            greyscaleProfileSrv.getProfile()
                .then(function (_user) {
                    user = _user;
                    return _user;
                })
                .then(_setAuthor);
            _policiesGenerate($scope.model.policy.sections);
            $state.ext.surveyName = i18n.translate('SURVEYS.NEW_SURVEY');
        }

        function _loadSurvey() {
            var params = {
                forEdit: true
            };

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
                        greyscaleWebSocketSrv.emit(wsEvents.policyLock, {
                            policyId: survey.policyId
                        });

                        angular.extend($scope.model.policy, {
                            id: survey.policyId,
                            title: survey.title,
                            section: survey.section,
                            subsection: survey.subsection,
                            number: survey.number,
                            answerId: survey.policyId,
                            attachments: survey.attachments || []
                        });

                        if (survey.editor) {
                            greyscaleUsers.get(survey.editor)
                                .then(function (user) {
                                    survey.editorUser = user;
                                });
                        }

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

        function _save() {
            var _survey,
                _policy = $scope.model.policy;

            _survey = angular.extend({}, $scope.model.survey);
            _survey.projectId = projectId;
            _survey.isPolicy = true;

            var _questions = $scope.model.survey.questions;

            if (surveyId) {
                _survey.id = surveyId;
            }
            angular.extend(_survey, {
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

            (_survey.id ? greyscaleSurveyApi.update(_survey) : greyscaleSurveyApi.add(_survey))
            .then(function (resp) {
                    $scope.model.survey.questions = _questions;
                    if (!_survey.id) {
                        $scope.model.survey.id = resp.id;
                    }
                    _goPolicyList();
                })
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
            greyscaleWebSocketSrv.emit(wsEvents.policyUnlock);

            $state.go('policy');
        }

        function _publish() {
            $scope.model.survey.isDraft = false;
            $scope.save();
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
