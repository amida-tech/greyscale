/**
 * Created by igi on 28.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalTranslationCtrl', function ($scope, $q, _, greyscaleUtilsSrv, $uibModalInstance, translation,
        greyscaleLanguageApi, greyscaleTranslationApi) {

        $scope.model = {
            translations: [],
            originalTrn: [],
            languages: [],
            original: {}
        };

        $scope.close = closeModal;
        $scope.add = addTranslation;
        $scope.del = removeTranslaction;
        $scope.save = saveChanges;

        var _idx = 0,
            valuesLength = 1;

        var req = {
            lang: greyscaleLanguageApi.list(),
            trns: greyscaleTranslationApi.listByEntity(translation.essenceId, translation.entityId,
                {field: translation.field})
        };

        if (translation.type === 'bullet_points') {
            _idx = translation.index || 0;
            valuesLength = translation.value.length;
        }

        $q.all(req).then(function (res) {
            var l,
                qty = res.lang.length,
                _origin = angular.copy(translation);

            $scope.model.languages = [];

            for (l = 0; l < qty; l++) {
                if (res.lang[l].id === _origin.langId) {
                    _origin.langId = res.lang[l].code;
                } else {
                    $scope.model.languages.push(res.lang[l]);
                }
            }

            if (translation.type === 'bullet_points') {
                var _jsonArr, i,
                    q = res.trns.length;

                _origin.value = translation.value[translation.index].data;

                for (i = 0; i < q; i++) {
                    _jsonArr = angular.fromJson(res.trns[i].value);
                    res.trns[i].valueArr = _jsonArr;
                    res.trns[i].value = _jsonArr[_idx];
                }

                $scope.model.translations = res.trns;
            } else {
                $scope.model.translations = res.trns;
            }
            $scope.model.originalTrn = angular.copy(res.trns);

            $scope.model.original = _origin;

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
                if (translation.type === 'bullet_points') {
                    bulletsToString(trn);
                }

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

        function bulletsToString(rec) {
            if (!rec.valueArr){
                rec.valueArr = [];
                rec.valueArr.length = valuesLength;
                rec.valueArr.fill('');
            }
            rec.valueArr[_idx] = rec.value;

            rec.value = angular.toJson(rec.valueArr);

            delete rec.valueArr;
        }
    });
