'use strict';

(function(){

    var supportedLanguages = [{
        locale: 'en',
        label: 'English',
        flagUrl:'data:image/png;base64,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'
    }, {
        locale: 'ru',
        label: 'Русский',
        flagUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AEbBzgxI+biSAAAAVZJREFUSMftlr9OwzAQhz+7aSOgFAmYmFhg4AF4MEZejI2JZ2DmAZAQtBAa++4Y+icOtBWVirPwWxJfTrov57PvHHAMDIAeeSVAXQCHZvZEB3LOnXtgRHcaeaDsEKD0dKx/gM4BCoDrmzvOTvb4mMYsQffLgtf3ugEIqoyrQFVL29MAlzxX2Um+bfJL7KJGHbUBiFGZVIHPOYBzDjNbvreYvtnN7IfPOi18RbQNEMQYV5EwN/616ujpeZdkQJRJFQmSB6Df8xwd9FMAQUxRszxdyJQgkmxBMExBNQ+AOUcIaRFqxPBkio9BOwMP97f0MWxab9lPk6O46jiu+SFXDgjOc7kAUInQK2DbGrANa9tMLhKbDKjobB7KVITLmIteIKrwy8tkR6MQqgmAbnGb7WgUWwIUsytylgE/HObbAmsARIGX8VvWNjyvNnHABXAFnGYeBZ6Bxy9wpq7qngC+gwAAAABJRU5ErkJggg=='
    }];

    var localesList = _getLocalesList(supportedLanguages);

    window.L10N = _loadL10n;

    _injectL10N();

    ///////////////

    function _getLocalesList(supportedLanguages) {
        var localesList = [];
        for (var i = 0; i < supportedLanguages.length; i++) {
            localesList.push(supportedLanguages[i].locale);
        }
        return localesList;
    }

    function _loadL10n(locale, l10n) {
        window.I18N = {
            locale: locale,
            translations: l10n,
            supportedLanguages: supportedLanguages,
            localesList: localesList
        };
        delete window.L10N;
        _runNgApp();
    }

    function _injectL10N() {
        var locale = getLocale();
        _injectScript('l10n/' + locale + '.js');
        if (locale !== 'en') {
            _injectScript('l10n/angular-locale/angular-locale_' + locale + '.js', _initNgLocale);
        }
    }

    function _injectScript(src, callback) {
        var script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
        script.onreadystatechange = script.onload = callback;
    }

    function getLocale() {
        var locale = _getCookie('locale');
        if (locale && localesList.indexOf(locale) >= 0) {
            return locale;
        } else {
            return localesList[0];
        }
    }

    function _runNgApp() {
        angular.element(document).ready(function(){
            angular.bootstrap(document.body, ['greyscaleApp']);
        });
    }

    function _initNgLocale() {
        window.i18nNgLocaleLoaded = true;
    }

    function _getCookie(name){
        return(document.cookie.match('(^|; )'+name+'=([^;]*)')||0)[2];
    }

})();

angular.module('greyscale.core')
    .provider('i18n', function i18nProvider(){
        var _locale,
            _localesList,
            _supportedLanguages,
            _cookies,
            pub = {
                getLocale: _getLocale,
                getLocalesList: _getLocalesList,
                getSupportedLanguages: _getSupportedLanguages,
                isSupported: _isSupported,
                changeLocale: _changeLocale
            };

        function _init(translateProvider) {

            if (typeof window.I18N !== 'object') {
                throw 'Expected global I18N object!';
            }

            _locale = window.I18N.locale;
            _localesList = window.I18N.localesList;
            _supportedLanguages = window.I18N.supportedLanguages;

            translateProvider.translations(_locale, window.I18N.translations);
            translateProvider.preferredLanguage(_locale);
            translateProvider.useSanitizeValueStrategy(null);

            delete(window.I18N);
        }

        function _changeLocale(locale) {
            if (locale !== _locale && _isSupported(locale)) {
                _cookies.put('locale', locale);
                window.location.reload();
            }
        }

        function _getLocale() {
            return _locale;
        }

        function _getLocalesList() {
            return _localesList;
        }

        function _getSupportedLanguages() {
            return _supportedLanguages;
        }

        function _isSupported(locale) {
            return _localesList.indexOf(locale) >= 0;
        }

        return {
            init: _init,
            useNgLocale: pub.useNgLocale,
            $get: ['$cookies', '$translate', '$rootScope', function ($cookies, $translate, $rootScope) {
                $translate.use(_locale);
                _cookies = $cookies;
                pub.t = $translate.instant;
                $rootScope.currentLocale = _locale;

                return pub;
            }]
        };
    })
    .run(function(uibDatepickerPopupConfig, $locale, i18n){

        _resolveNgLocaleLoading();

        var datepickerPopupL10n = {
            clearText: t('RESET'),
            closeText: t('DONE'),
            currentText: t('TODAY'),
            datepickerPopup: t('DATE_FORMAT')
        };

        angular.extend(uibDatepickerPopupConfig, datepickerPopupL10n);

        function t(key, data) {
            return i18n.t('DATEPICKER.' + key, data);
        }

        function _resolveNgLocaleLoading() {
            if (i18n.getLocale() == 'en') {
                return;
            }

            if (window.i18nNgLocaleLoaded) {
                delete(window.i18nNgLocaleLoaded);
                console.log('ngLocale loaded');
                return;
            }

            var loop = setInterval(function(){
                if (window.i18nNgLocaleLoaded) {
                    delete(window.i18nNgLocaleLoaded);
                    clearInterval(loop);
                    _initNewNgLocale();
                }
            }, 15);
        }

        function _initNewNgLocale() {
            var injector = angular.injector(['ngLocale']),
                newLocale = injector.get('$locale');
            angular.extend($locale, newLocale);
        }
    })
;
