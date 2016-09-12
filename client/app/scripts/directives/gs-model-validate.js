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
            link: function (scope, el, attr, ngModel) {
                var validators = gsModelValidators.parse(scope.validators) || [];
                angular.forEach(validators, function (validator) {
                    gsModelValidators.apply(ngModel, validator, scope.$parent.modalFormRec);
                });
            }
        };
    })
    .service('gsModelValidators', function (_) {
        var _validators = {
            email: function (val) {
                return !!String(val).match(/(.+)@(.+)\.(.+)/);
            },
            // check for uniqueness using storage[dict] source
            // config.storage - container object for dicts
            // config.dict - dictionary property
            // config.field - field name to check values
            // config.idField - ID field to exclude current record
            // config.noExclude - do not exclude current record from checking (default false)
            // config.transform - transform comparing values
            // config.caseSensitive - case sensitive comparing (default true)
            unique: function (config) {
                if (config.caseSensitive === undefined) {
                    config.caseSensitive = true;
                }
                return function (val, rec) {
                    var checkVal = config.transform ? config.transform(val) : val;
                    if (!config.caseSensitive) {
                        checkVal = String(checkVal).toLowerCase();
                    }
                    var idField = config.idField || 'id';
                    return !_.find(config.storage[config.dict], function (obj) {
                        var objVal = config.transform ? config.transform(obj[config.field]) : obj[config.field];
                        if (!config.caseSensitive) {
                            objVal = String(objVal).toLowerCase();
                        }
                        return objVal === checkVal && (config.noExclude || obj[idField] !== rec[idField]);
                    });
                };
            },
            maxLength: function (config) {
                return function(val, rec, validator){
                    var str = String(val);
                    return str.length <= config;
                }
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
            validator.data = {};
            model.$parsers.unshift(function (value) {
                var valid = _isEmpty(value) || validator.isValidFn(value, rec, validator);
                model.$setValidity(validator.key, valid);
                return valid ? value : undefined;
            });
            model.$formatters.unshift(function (value) {
                var valid = _isEmpty(value) || validator.isValidFn(value, rec, validator);
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
                var isBoolean = typeof item === 'boolean';
                var isValidatorKeyOnly = inArray && typeof item === 'string' &&  _validators[item];
                var isFunction = typeof item === 'function';
                var hasName = !inArray && typeof name === 'string';

                if (isValidatorKeyOnly) {
                    validators.push({
                        key: item,
                        isValidFn: _validators[item]
                    });
                } else if (inArray && isObject) {
                    validators = validators.concat(_parse(item));

                } else if (hasName && _validators[name] && isBoolean) {
                    if (item) {
                        validators.push({
                            key: name,
                            isValidFn: _validators[name]
                        });
                    }
                } else if (hasName && _validators[name] && !isFunction) {
                    validators.push({
                        key: name,
                        limit: item,
                        isValidFn: _validators[name](item)
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
