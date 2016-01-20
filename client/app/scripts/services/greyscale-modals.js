/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .factory('greyscaleModalsSrv', function ($uibModal) {

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
            }).result;
        }

        function _simpleMiddleForm(tmplUrl, data, ext) {
            _simpleForm(tmplUrl, data, ext, 'md');
        }

        function _simpleLargeForm(tmplUrl, data, ext) {
            _simpleForm(tmplUrl, data, ext, 'lg');
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
            }).result;
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
                size: 'max',
                windowClass: 'modal fade in'
            }).result;
        }

        function _productWorkflow(product) {
            return $uibModal.open({
                templateUrl: 'views/modals/product-workflow.html',
                controller: 'ModalProductWorkflowCtrl',
                size: 'lg',
                windowClass: 'modal fade in',
                resolve: {
                    product: product
                }
            }).result;
        }

        return {
            editRec: modalForm,
            editCountry: function (_country) {
                return _simpleMiddleForm('views/modals/country-form.html', _country, null);
            },
            editUserProfile: function (_user) {
                return _simpleMiddleForm('views/modals/user-profile-form.html', _user, null);
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
            uoasFilter: _uoasFilter,
            productUoas: _productUoas,
            productWorkflow: _productWorkflow
        };
    });
