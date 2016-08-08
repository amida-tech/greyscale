/**
 *  form field model validation
 *
 *  // use builtin validator with no params (array notation)
 *  <input ng-model="model" gs-validate="['email', ...]" />
 *
 *  // use builtin validator with parameters (mixed array and object notation)
 *  <input ng-model="model" gs-validate="['email', {unique: {storage: ..., dict: ..., ... }}]" />
 *
 *  // use builtin validator with parameters (object notation)
 *  <input ng-model="model" gs-validate="{email: true, unique: {...}, ...}" />
 *
 *  // use custom validator with function returns true if value is valid (object notation)
 *  <input ng-model="model" gs-validate="{matchCondition: _isValidFn, ...}" />
 *  ...
 *  function isValidFn(value, rec) {
 *    return value !== rec.password;
 *  }
 */

angular.module('greyscaleApp')
.directive('gsModelValidate', function (gsModelValidators) {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            validators: '=gsModelValidate'
        },
        link: function(scope, el, attr, ngModel) {
            var validators = gsModelValidators.parse(scope.validators);
            angular.forEach(validators, function(validator){
                gsModelValidators.apply(ngModel, validator, scope.$parent.modalFormRec);
            });
        }
    };
})
.service('gsModelValidators', function(_){
    var _validators = {
        email: function(val){
            return !!String(val).match(/(.+)@(.+)\.(.+)/);
        },
        unique: function(config){
            return function(val){
                var query = {};
                query[config.field] = val;
                return !_.find(config.storage[config.dict], query);
            };
        }
    };

    var _pub = {
        addValidator: _addValidator,
        parse: _parse,
        apply: _apply
    };

    function _addValidator(key, isValidFn) {
        _validators[key] = isValidFn;
    }

    function _apply(model, validator, rec) {
        model.$parsers.unshift(function(value){
            var valid = _isEmpty(value) || validator.isValidFn(value, rec);
            model.$setValidity(validator.key, valid);
            return valid ? value : undefined;
        });
        model.$formatters.unshift(function(value){
            var valid = _isEmpty(value) || validator.isValidFn(value, rec);
            model.$setValidity(validator.key, valid);
            return value;
        });
    }

    function _isEmpty(value) {
        return value === undefined || value === '';
    }

    function _parse(validatorsData) {
        var validators = [];
        var inArray = angular.isArray(validatorsData);

        angular.forEach(validatorsData || [], function (item, name) {
            var isObject = angular.isObject(item);
            var isTrue = item === true;
            var isString = typeof item === 'string';
            var isFunction = typeof item === 'function';
            var hasName = !inArray && typeof name === 'string';

            if (inArray && isString && _validators[item]) {
                validators.push({
                    key: item,
                    isValidFn: _validators[item]
                });
            } else if (inArray && isObject) {
                validators = validators.concat(_parse(item));

            } else if (hasName && _validators[name] && isTrue) {
                validators.push({
                    key: name,
                    isValidFn: _validators[name]
                });
            } else if (hasName && _validators[name] && isObject) {
                validators.push({
                    key: name,
                    isValidFn: _validators[name](item),
                });
            } else if (hasName && isFunction) {
                validators.push({
                    key: name,
                    isValidFn: item
                });
            }
        });
        return validators;
    }

    return _pub;
});
