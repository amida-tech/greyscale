'use strict';

angular.module('greyscaleApp')
    .directive('draggable', function(){
        return {
            restrict: 'A',
            link: function(scope, el){
                el.addClass('draggable');
                el[0].addEventListener('dragstart',function(e) {
                    console.log(e);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('ID', this.id);
                    el.addClass('drag');
                    return false;
                }, false);
                el[0].addEventListener('dragend', function(e) {
                    el.removeClass('drag');
                    return false;
                }, false);
            }
        };
    })
    .directive('droppable', function(){
        return {
            restrict: 'A',
            link: function(scope, el, attr){
                el[0].addEventListener('dragover', function(e) {
                    e.dataTransfer.dropEffect = 'move';
                    e.preventDefault();
                    el.addClass('over');
                    return false;
                }, false);
                el[0].addEventListener('dragenter', function(e){
                   el.removeClass('over');
                }, false);
                el[0].addEventListener('drop', function(e){
                   e.stopPropagation();
                   el.removeClass('over');
                   scope.$eval(attr.droppable);
                });
            }
        };
    });
