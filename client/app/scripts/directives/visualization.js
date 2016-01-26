'use strict';

angular.module('greyscaleApp')
  .directive('mapViz', function ($window, greyscaleSurveySrv){
    return {
      restrict: 'EA',
      template: "<svg style='width:100%;'></svg>",
      scope: {
        vizData: '=',
        geoData: '=',
        surveys: '=',
        filterParams: '&',
        filterOptions: '&'
         //Figure out this design
      },
      
      link: function(scope, element, attrs){
        var vizData = [];
        var geoData = [];
        var filterParams = {};

        //var d3 = $window.d3;
        var d3selectContainer = d3.select(element[0]);


        function parseQuery(){

        }

        function applyFilters(){

        }

        function renderMap(){
          try{
            //var d3plus = $window.d3plus;
              d3plus.viz()
                .container(d3selectContainer)        
                .data(vizData)        
                .coords(geoData) //add as a resource somewhere 
                .type("geo_map") 
                .legend({"value": true})        
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

        scope.$watchGroup(['vizData', 'geoData'], function(newVals, oldVals){
          vizData = newVals[0].agg;
          geoData = newVals[1];
          renderMap();
        });

        scope.$watch('filterParams', function(newVal, oldVal){
          filterParams = newVal;
          renderMap();
        });
      }
    };
  });