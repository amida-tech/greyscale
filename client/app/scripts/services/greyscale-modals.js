/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .factory('greyscaleModalsSrv', function ($uibModal) {
        function _simpleForm (tmplUrl, data, ext) {
            return $uibModal.open({
                templateUrl: tmplUrl,
                controller: 'SimpleFormCtrl',
                size: 'md',
                windowClass: 'modal fade in',
                resolve: {
                    formData: data,
                    extData: ext
                }
            }).result;
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

        return {
            editCountry: function (_country) {
                return _simpleForm('views/modals/country-form.html', _country, null);
            },
            editUoa: function (_uoa, extData) {
                return _simpleForm('views/modals/uoa-form.html', _uoa, extData);
            },
            editUoaType: function (_uoaType, _languages) {
                return _simpleForm('views/modals/uoatype-form.html', _uoaType, _languages);
            },
            editUoaTag: function (_uoaType, extData) {
                return _simpleForm('views/modals/uoatag-form.html', _uoaType, extData);
            },
            editUoaClassType: function (_uoaClassType, _languages) {
                return _simpleForm('views/modals/uoaclasstype-form.html', _uoaClassType, _languages);
            },
            editUserOrganization: function (_org) {
                return _simpleForm('views/modals/user-organization-form.html', _org, null);
            },
            addRoleRight: function (_role, _ext) {
                return _simpleForm('views/modals/role-right-form.html', _role, _ext);
            },
            editRec: modalForm
        };
    });
