angular.module('greyscaleApp')
    .directive('propagateDisabled', function () {
        return {
            restrict: 'A',
            scope: false,
            link: function (scope, el, attrs) {
                var searchSelector = 'textarea,input:not(.disable-control),select,button';

                var dereg = attrs.$observe('disabled', function (state) {
                    var children = _getDependentChildren(el, searchSelector);
                    _propagateDisable(children, state);

                    var expand = el.next();
                    if (expand.hasClass('expand-row')) {
                        var expandChildren = _getDependentChildren(expand, searchSelector);
                        _propagateDisable(expandChildren, state);
                    }

                });

                scope.$on('$destroy', function () {
                    dereg();
                });
            }
        };

        function _getDependentChildren(el, selector) {
            var depChildren = el[0].querySelectorAll(selector);
            return depChildren;
        }

        function _propagateDisable(children, state) {
            angular.forEach(children, function (input) {
                input.disabled = state ? 'disabled' : undefined;
            });
        }
    });
