/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .factory('greyscaleModalsSrv', function ($uibModal) {
    function _simpleForm(tmplUrl, data, ext) {
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
        editUoa: function (_uoa, form) {
            return modalForm(_uoa, form);
        },
        editUoaType: function (_uoaType, form) {
            return modalForm(_uoaType, form);
        },
        editUoaTag: function (_uoaTag, form) {
            return modalForm(_uoaTag, form);
        },
        editUoaClassType: function (_uoaClassType, form) {
            return modalForm(_uoaClassType, form);
        },
        editUserOrganization: function (_org) {
            return _simpleForm('views/modals/user-organization-form.html', _org, null);
        },
        addRoleRight: function (_role, _ext) {
            return _simpleForm('views/modals/role-right-form.html', _role, _ext);
        },
        editRight: function (_right, _ext) {
            return _simpleForm('views/modals/right-form.html', _right, _ext);
        },
        editSurvey: function (_right, _ext) {
            return _simpleForm('views/modals/survey-form.html', _right, _ext);
        },
        editProject: function (prj, form) {
            return modalForm(prj, form);
        }
    };
});
