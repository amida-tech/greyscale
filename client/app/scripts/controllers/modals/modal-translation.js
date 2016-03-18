/**
 * Created by igi on 28.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalTranslationCtrl', function ($scope, $q, _, greyscaleUtilsSrv, $uibModalInstance, translation,
        greyscaleLanguageApi, greyscaleTranslationApi) {

        $scope.model = {
            translations: [translation],
            originalTrn: [translation],
            languages: [],
            original: translation
        };

        $scope.close = closeModal;
        $scope.add = addTranslation;
        $scope.del = removeTranslaction;
        $scope.save = saveChanges;

        var req = {
            lang: greyscaleLanguageApi.list(),
            trns: greyscaleTranslationApi.listByEntity(translation.essenceId, translation.entityId,
                {field: translation.field})
        };

        $q.all(req).then(function (res) {
            var l,
                qty = res.lang.length;
            $scope.model.languages = [];

            for (l = 0; l < qty; l++) {
                if (res.lang[l].id === $scope.model.original.langId) {
                    $scope.model.original.langId = res.lang[l].code;
                } else {
                    $scope.model.languages.push(res.lang[l]);
                }
            }

            $scope.model.translations = res.trns;
            $scope.model.originalTrn = angular.copy(res.trns);

        });

        function closeModal() {
            $uibModalInstance.dismiss();
        }

        function addTranslation() {
            $scope.model.translations.push(_.pick(translation, ['essenceId', 'entityId', 'field']));
        }

        function removeTranslaction(index) {
            $scope.model.translations.splice(index, 1);
        }

        function saveChanges() {
            var t, trn;
            var taskReqs = [];

            for (t = 0; t < $scope.model.translations.length; t++) {
                trn = $scope.model.translations[t];

                for (var ot = 0; ot < $scope.model.originalTrn.length; ot++) {
                    var oTrn = $scope.model.originalTrn[ot];
                    if (oTrn.langId === trn.langId) {
                        if (oTrn.value === trn.value) {
                            $scope.model.originalTrn[ot].task = 'nop';
                            $scope.model.translations[t].task = 'nop';
                        } else {
                            $scope.model.translations[t].task = 'edt';
                            $scope.model.originalTrn[ot].task = 'edt';
                        }
                    }
                }
            }

            for (t = 0; t < $scope.model.translations.length; t++) {
                trn = $scope.model.translations[t];
                if (trn.task) {
                    if (trn.task === 'edt') {
                        delete trn.task;
                        taskReqs.push(greyscaleTranslationApi.edit(trn));
                    }
                } else {
                    taskReqs.push(greyscaleTranslationApi.add(trn));
                }
            }

            for (t = 0; t < $scope.model.originalTrn.length; t++) {
                trn = $scope.model.originalTrn[t];
                if (!trn.task) {
                    taskReqs.push(greyscaleTranslationApi.delete(trn));
                }
            }

            $uibModalInstance.close($q.all(taskReqs));
        }
    });
