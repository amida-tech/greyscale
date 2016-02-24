'use strict';

angular.module('greyscaleApp')
    .directive('hiddenSelect', function ($compile) {
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, el, attr) {
                var config = scope.$eval(attr.hiddenSelect);

                var labelField = config.labelField || 'name';
                var data;
                if (typeof config.data === 'function') {
                    data = config.data();
                } else {
                    data = config.data;
                }

                scope.options = data;

                scope.selectedItem = scope.options[0] ? scope.options[0] : undefined;

                if (typeof config.disableItem === 'function') {
                    scope.disableItem = function (item) {
                        return config.disableItem(config.model, item);
                    };
                }

                var select = angular.element('<select class="hidden-select" ' +
                    'ng-model="selectedItem"' +
                    'ng-options="item.' + labelField + ' disable when disableItem(item) for item in options">' +
                    '    <option value="" style="display: none"></option>' +
                    '</select>');

                if (config.hideDisabled) {
                    select.addClass('hide-disabled');
                }

                $compile(select)(scope);
                el.append(select);

                select.on('click', function (e) {
                    if (select.val() === '') {
                        return;
                    }
                    if (typeof config.onChange === 'function') {
                        config.onChange(config.model, scope.selectedItem);
                    }
                });

            }
        };
    });
