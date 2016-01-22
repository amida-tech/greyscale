angular
    .module('greyscaleApp')
    .factory('d3plusSrv', ['$document', '$window', '$q', '$rootScope',
        function ($document, $window, $q, $rootScope) {
            var d = $q.defer(),
                d3plusService = {
                    d3plus: function () {
                        return d.promise;
                    }
                };

            function onScriptLoad() {
                // Load client in the browser
                $rootScope.$apply(function () {
                    d.resolve($window.d3plus);
                });
            }
            var scriptTag = $document[0].createElement('script');
            scriptTag.type = 'text/javascript';
            scriptTag.async = true;
            scriptTag.src = 'bower_components/d3plus/d3plus.min.js';
            scriptTag.onreadystatechange = function () {
                if (this.readyState === 'complete') {
                    onScriptLoad();
                }
            };
            scriptTag.onload = onScriptLoad;

            var s = $document[0].getElementsByTagName('body')[0];
            s.appendChild(scriptTag);

            return d3plusService;
        }
    ]);
