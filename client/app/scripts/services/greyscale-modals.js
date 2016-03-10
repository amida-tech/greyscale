/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .factory('greyscaleModalsSrv', function ($uibModal, $q) {

        function hndlModalErr(err) {
            return $q.reject('');
        }

        function _simpleForm(tmplUrl, data, ext, size) {
            return $uibModal.open({
                templateUrl: tmplUrl,
                controller: 'SimpleFormCtrl',
                size: size,
                windowClass: 'modal fade in',
                resolve: {
                    formData: data,
                    extData: ext
                }
            }).result.catch(hndlModalErr);
        }

        function _simpleMiddleForm(tmplUrl, data, ext) {
            return _simpleForm(tmplUrl, data, ext, 'md');
        }

        function _simpleLargeForm(tmplUrl, data, ext) {
            return _simpleForm(tmplUrl, data, ext, 'lg');
        }

        function modalForm(data, tableDescription) {
            return $uibModal.open({
                templateUrl: 'views/modals/modal-form.html',
                controller: 'ModalFormCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    recordData: data,
                    recordForm: tableDescription
                }
            }).result.catch(hndlModalErr);
        }

        function modalRecInfo(data, tableDescription) {
            return $uibModal.open({
                templateUrl: 'views/modals/modal-rec-info.html',
                controller: 'ModalRecInfoCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    recordData: data,
                    recordForm: tableDescription
                }
            }).result.catch(hndlModalErr);
        }

        function _productUoas(product) {
            return $uibModal.open({
                templateUrl: 'views/modals/product-uoas.html',
                controller: 'ModalProductUoasCtrl',
                size: 'lg',
                windowClass: 'modal fade in',
                resolve: {
                    product: product
                }
            }).result;
        }

        function _uoasFilter() {
            return $uibModal.open({
                templateUrl: 'views/modals/uoas-filter.html',
                controller: 'ModalUoasFilterCtrl',
                size: 'xxl',
                windowClass: 'modal fade in'
            }).result;
        }

        function _productWorkflow(product) {
            return $uibModal.open({
                templateUrl: 'views/modals/product-workflow.html',
                controller: 'ModalProductWorkflowCtrl',
                controllerAs: 'ctrl',
                size: 'xxl',
                windowClass: 'modal fade in',
                resolve: {
                    product: product
                }
            }).result;
        }

        function _productTask(task, activeBlock) {
            return $uibModal.open({
                templateUrl: 'views/modals/product-task.html',
                controller: 'ModalProductTaskCtrl',
                controllerAs: 'ctrl',
                size: 'xxl',
                windowClass: 'modal fade in',
                resolve: {
                    task: task,
                    activeBlock: activeBlock
                }
            }).result;
        }

        function _translationForm(translation) {
            return $uibModal.open({
                templateUrl: 'views/modals/translation-form.html',
                controller: 'ModalTranslationCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    translation: translation
                }
            }).result;
        }

        function _confirm(params) {
            return $uibModal.open({
                templateUrl: 'views/modals/confirm.html',
                controller: 'ModalConfirmCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    params: params
                }
            }).result;
        }

        function _userGroups(user) {
            return $uibModal.open({
                templateUrl: 'views/modals/user-groups.html',
                controller: 'ModalUserGroupsCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    user: user
                }
            }).result;
        }

        function _editIndex(index, type, product) {
            return $uibModal.open({
                templateUrl: 'views/modals/edit-index.html',
                controller: 'ModalEditIndexCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    index: index,
                    type: function () { return type; },
                    product: product
                }
            }).result;
        }

        function _editVisualization(visualization) {
            return $uibModal.open({
                templateUrl: 'views/modals/edit-visualization.html',
                controller: 'ModalEditVisualizationCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    visualization: visualization
                }
            }).result;
        }

        return {
            editRec: modalForm,
            showRec: modalRecInfo,
            editCountry: function (_country) {
                return _simpleMiddleForm('views/modals/country-form.html', _country, null);
            },
            editUserOrganization: function (_org) {
                return _simpleMiddleForm('views/modals/user-organization-form.html', _org, null);
            },
            addRoleRight: function (_role, _ext) {
                return _simpleMiddleForm('views/modals/role-right-form.html', _role, _ext);
            },
            editSurvey: function (_right, _ext) {
                return _simpleLargeForm('views/modals/survey-form.html', _right, _ext);
            },
            editTranslations: _translationForm,
            uoasFilter: _uoasFilter,
            productUoas: _productUoas,
            productWorkflow: _productWorkflow,
            productTask: _productTask,
            userGroups: _userGroups,
            editIndex: _editIndex,
            editVisualization: _editVisualization,
            confirm: _confirm
        };
    });
