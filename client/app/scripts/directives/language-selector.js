angular.module('greyscaleApp')
    .directive('languageSelector', function (_, i18n, greyscaleLanguageApi) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'views/directives/language-selector.html',
            link: function (scope, el) {
                var supportedLocales = i18n.getLocales();

                if (supportedLocales.length === 1) {
                    el.remove();
                    return;
                }

                greyscaleLanguageApi.list()
                    .then(function (langs) {
                        var languages = [];
                        angular.forEach(langs, function(lang){
                            if (~supportedLocales.indexOf(lang.code)) {
                                languages.push({
                                    locale: lang.code,
                                    label: lang.nativeName,
                                    tooltip: lang.name,
                                    flagUrl: 'images/flags/' + lang.code + '.png'
                                });
                            }
                        });

                        if (languages.length <= 1) {
                            el.remove();
                            return;
                        }

                        scope.languages = languages;

                        scope.selected = _.find(scope.languages, {
                            locale: i18n.getLocale()
                        });

                        scope.changeLanguage = function (locale) {
                            i18n.changeLocale(locale);
                        };
                    });
            }
        };
    });
