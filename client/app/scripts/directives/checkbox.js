'use strict';

(function(){
    angular.module('greyscaleApp')
    .directive('type', function(){
        return {
            restrict: 'A',
            priority: -1,
            link: function(scope, el, attr){
                if (attr.type !== 'checkbox' || el.hasClass('styled-checkbox')) {
                    return;
                }
                _styleCheckbox(el);
            }
        };
    });

    //$(document).on('DOMNodeInserted', function(e){
    //    $(e.target).find('input[type="checkbox"]:not(.styled-checkbox)').each(function(){
    //        var el = $(this);
    //        _styleCheckbox(el);
    //    });
    //});
    //
    function _styleCheckbox(el) {
        var id = el[0].id || Math.round(Math.random()*1e10);
        el[0].id = id;
        el.addClass('styled-checkbox');
        el.after('<label for="' + id + '" class="styled-checkbox text-primary"></label>');
    }
})();
