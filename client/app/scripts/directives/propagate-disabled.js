angular.module('greyscaleApp')
    .directive('propagateDisabled', function () {
        return {
            restrict: 'A',
            scope: false,
            link: function (scope, el, attrs) {
                var children;
                var dereg = attrs.$observe('disabled', function (state) {
                    children = _getDependentChildren(el);
                    _propagateDisable(children, state);
                });

                scope.$on('$destroy', function () {
                    dereg();
                });
            }
        };

        function _getDependentChildren(el) {
            return el[0].querySelectorAll('textarea,input:not(.disable-control),select,button');
        }

        function _propagateDisable(children, state) {
            angular.forEach(children, function (input) {
                input.disabled = state ? 'disabled' : undefined;
            });
        }
    });
