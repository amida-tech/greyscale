'use strict';

angular.module('greyscaleApp')
    .directive('printArea', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, el, attr) {
                var printable = $('#printable');
                if (!printable.length) {
                    printable = $('<div id="printable"></div>');
                    $('body').append(printable);
                }

                el.on('click', function () {
                    var id = attr.printArea;
                    var area = $('[printing-area="' + id + '"]');
                    if (area.length) {
                        _printArea(area.clone());
                    }
                });

                var inputSelector = 'input, textarea, select';

                function _printArea(area) {
                    var mode = attr.printCssMode || '';
                    area.find(inputSelector).each(function (i,input) {
                        input = $(input);
                        input.attr('data-id', Math.round(Math.random() * 1e12));
                    });
                    var printing = $('<div><div class="' + mode + '">' + area.html() + '</div></div>');
                    printable.html(printing.html());
                    printable.find('a[href]').attr('href', '#');
                    if (!mode.match('clean-inputs') && !mode.match('hide-inputs')) {
                        area.find(inputSelector).each(function (i, input) {
                            input = $(input);
                            var printInput = printable.find('[data-id="' + input.attr('data-id') + '"]');
                            if (input[0].checked) {
                                printInput.prop('checked', true);
                            }
                            printInput.val(input.val());
                        });
                    }

                    var preprocess = scope.$eval(attr.printPreprocess);
                    if (typeof preprocess === 'function') {
                        preprocess(printable);
                    }

                    $timeout(function () {
                        window.print();
                        $timeout(function () {
                            if (attr.printClose !== undefined) {
                                scope.$eval(attr.printClose);
                            }
                            printable.html('');
                        });
                    });
                }
            }
        };
    });
