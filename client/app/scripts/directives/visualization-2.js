'use strict';

angular
    .module('greyscaleApp')
    .directive('mapVizOld', function ($window, greyscaleSurveySrv, _) {
        return {
            templateUrl: 'views/directives/visualization.html',
            restrict: 'E',
            link: function (scope, elem, attr) {

              scope.data = ["MOCK SOME DATA HERE"];

              var soloData = [];
              var muteData = ["AM", "ZA", "MZ"]; //hack so names don't render huge

              //var d3 = $window.d3; <-- zooming doesn't work when services used
              var d3selectContainer = d3.select(element.find('svg')[0]);


              //OLD D3PLUS CODE
              try{
                //var d3plus = $window.d3plus;
                d3plus.viz()
                  .container(d3selectContainer)        
                  .data(vizData)        
                  //.coords({"value":geoData, "center":[10,0]}) //fix edge of Russia/Alaska
                  .coords(geoData)
                  .type("geo_map") 
                  .legend(true)        
                  //.id({"value":["continent","isoa2", "country"], "mute": muteData, "solo": soloData})          
                  .id("isoa2")
                  .text("country")             
                  .color("rank")
                  .time({"value":"year", "solo":2016})
                  .timeline(true)          
                  .tooltip(["country", "rank","dtf"])        
                  .draw(); 
              } catch (e) {
                console.log(e);
              }
            }
          }
        });