angular.module('greyscaleApp')
    .directive('languageSelector', function(_, i18n){
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'views/directives/language-selector.html',
            link: function(scope) {
                scope.supportedLanguages = i18n.getSupportedLanguages();

                scope.selected = _.find(scope.supportedLanguages, {locale: i18n.getLocale()});

                scope.changeLanguage = function(locale){
                    i18n.changeLocale(locale);
                };
            }
        };
    });
