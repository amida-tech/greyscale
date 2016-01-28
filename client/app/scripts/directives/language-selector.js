angular.module('greyscaleApp')
    .directive('languageSelector', function (_, i18n) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'views/directives/language-selector.html',
            link: function (scope, el) {
                if (i18n.getLocales().length === 1) {
                    el.remove();
                    return;
                }

                scope.languages = i18n.getLanguages();

                scope.selected = _.find(scope.languages, {
                    locale: i18n.getLocale()
                });

                scope.changeLanguage = function (locale) {
                    i18n.changeLocale(locale);
                };
            }
        };
    });
