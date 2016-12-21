/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .factory('greyscaleModalsSrv', function ($uibModal, $q) {

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
            confirm: _confirm,
            dialog: _dialog,
            showVersion: _showVersion,
            sendNotification: _sendNotification,
            sendGroupNotification: _sendGroupNotification,
            changePassword: _changePassword,
            editIndex: _editIndex,
            editVisualization: _editVisualization,
            addProduct: _addProduct,
            importDataset: _importDataset,
            policyComment: _policyComment,
            fullScreenComment: _fullScreenComment,
            saveAsWorkflowTemplate: _saveAsWorkflowTemplate,
            selectPolicyVersion: _selectPolicyVersion
        };

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

        function _productWorkflow(modalData) {
            return $uibModal.open({
                templateUrl: 'views/modals/product-workflow.html',
                controller: 'ModalProductWorkflowCtrl as ctrl',
                controllerAs: 'ctrl',
                size: 'xxl',
                windowClass: 'modal fade in',
                resolve: {
                    modalData: modalData
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

        function _showVersion(params) {
            return $uibModal.open({
                templateUrl: 'views/modals/answer-version.html',
                controller: 'ModalAnswerVersionCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    params: params
                }
            }).result;
        }

        function _sendNotification(user, data) {
            return $uibModal.open({
                templateUrl: 'views/modals/send-notification.html',
                controller: 'ModalSendNotificationCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    users: function () { return [user]; },
                    data: data
                }
            }).result;
        }

        function _sendGroupNotification(users, data) {
            return $uibModal.open({
                templateUrl: 'views/modals/send-notification.html',
                controller: 'ModalSendNotificationCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    users: function () { return users.concat(users); },
                    data: data
                }
            }).result;
        }

        function _changePassword(user, realm) {
            return $uibModal.open({
                templateUrl: 'views/modals/change-password.html',
                controller: 'ModalChangePasswordCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    user: user,
                    data: {
                        realm: realm
                    }
                }
            }).result;
        }

        function _editIndex(index, type, product) {
            return $uibModal.open({
                templateUrl: 'views/modals/edit-index.html',
                controller: 'ModalEditIndexCtrl',
                size: 'xxl',
                windowClass: 'modal fade in',
                resolve: {
                    index: index,
                    type: $q.when(type),
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

        function _addProduct(productIndex, products) {
            return $uibModal.open({
                templateUrl: 'views/modals/add-product.html',
                controller: 'ModalAddProductCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    productIndex: productIndex,
                    products: products
                }
            }).result;
        }

        function _importDataset(dataset, visualizationId) {
            return $uibModal.open({
                templateUrl: 'views/modals/import-dataset.html',
                controller: 'ModalImportDatasetCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    dataset: dataset,
                    visualizationId: $q.when(visualizationId)
                }
            }).result;
        }

        function _policyComment(model, options) {
            return $uibModal.open({
                templateUrl: 'views/modals/policy-comment.html',
                controller: 'PolicyCommentFormCtrl',
                size: 'lg',
                windowClass: 'modal fade in',
                resolve: {
                    formData: model,
                    extData: options
                }
            }).result;
        }

        function _fullScreenComment(comment, options) {
            return $uibModal.open({
                templateUrl: 'views/modals/comment-full-screen.html',
                controller: 'ModalCommentFullScreenCtrl',
                size: 'xxl',
                windowClass: 'modal fade in',
                resolve: {
                    comment: comment,
                    options: options
                }
            }).result.catch(hndlModalErr);
        }

        function _saveAsWorkflowTemplate(data) {
            return $uibModal.open({
                templateUrl: 'views/modals/save-as-workflow-template-form.html',
                controller: 'ModalSaveAsWorkflowTemplateCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    modalData: data
                }
            }).result;
        }

        function _selectPolicyVersion(survey, _mode, status) {
            return $uibModal.open({
                templateUrl: 'views/modals/select-policy-version.html',
                controller: 'ModalSelectReviewVersionsCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    survey: survey,
                    mode: _mode,
                    status: status
                }
            }).result;
        }

        function _dialog(_params) {
            return $uibModal.open({
                templateUrl: 'views/modals/modal-dlg.html',
                controller: 'ModalDlgCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    params: _params
                }
            }).result;
        }
    });
