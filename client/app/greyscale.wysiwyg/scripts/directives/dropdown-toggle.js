/**
 * Created by igi on 04.08.16.
 */
angular.module('ui.bootstrap')
    .directive('dropdownToggle', function ($document, $location) {
        var openElement = null,
            closeMenu = angular.noop;
        return {
            restrict: 'CA',
            link: function (scope, element) {
                scope.$watch('$location.path', closeMenu);
                element.parent().bind('click', closeMenu);

                element.bind('click', function (event) {

                    var elementWasOpen = (element === openElement);

                    event.preventDefault();
                    event.stopPropagation();

                    if (!!openElement) {
                        closeMenu();
                    }

                    if (!elementWasOpen && !element.hasClass('disabled') && !element.prop('disabled')) {
                        element.parent().addClass('open');
                        openElement = element;
                        closeMenu = function (event) {
                            if (event) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                            $document.unbind('click', closeMenu);
                            element.parent().removeClass('open');
                            closeMenu = angular.noop;
                            openElement = null;
                        };
                        $document.bind('click', closeMenu);
                    }
                });
            }
        };
    });
