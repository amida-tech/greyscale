'use strict';

angular.module('greyscaleApp')
  .directive('mapViz', function ($window, greyscaleSurveySrv){
    return {
      restrict: 'EA',
      template: "<svg style='width:100%;'></svg>",
      scope: {
        vizData: '&',
        geoData: '&',
        surveys: '&',
        filterParams: '&',
        filterOptions: '&'
         //Figure out this design
      },
      
      link: function(scope, element, attrs){
        var vizData = [];
        var geoData = [];
        var filterParams = {};

        var soloData = [];
        var muteData = ["AM", "ZA", "MZ"]; //hack so names don't render huge

        //var d3 = $window.d3; <-- zooming doesn't work when services used
        var d3selectContainer = d3.select(element[0]);

        // function parseQuery(){
        //   if(filterParams.mapQuery == "") { return filterParams.mapQuery };
        //   //Turn query string into json object
        //   var keyValPairs = filterParams.mapQuery.split(" ");

        // }

        //Use d3plus solo/mute filtering options (instead of modifying vizData)
        function applyFilters(){
          try{
            scope.filterParams.topicSelected.forEach(function(country){
              soloData.push(country.isoa2);
            });
            vizData.forEach(function(row){
              var category = scope.filterParams.subtopicSelected.category;
              switch(scope.filterParams.subtopicSelected.subtopic.name){
                case "Continent":
                  if(row.continent==category.isoa2){
                    soloData.push(row.isoa2);
                  }
                case "Income":
                  var incomeBracket = [];
                  scope.filterOptions.incomeLevels.forEach(function(lvl){
                    if(lvl.name==category){
                      incomeBracket=lvl.countries;
                    }
                  });
                  if(incomeBracket.indexOf(row.isoa2)){
                    soloData.push(row.isoa2);
                  }
                case "Region": //Condense repeated code into helper function once region-spec implemented
                  var regionGroup = [];
                  scope.filterOptions.regions.forEach(function(reg){
                    if(reg.name==category){
                      regionGroup = reg.countries;
                    }
                  });
                  if(incomeBracket.indexOf(row.isoa2)){
                    soloData.push(row.isoa2);
                  }
                default:
              }
            });
          } catch(e) {
            console.log(e);
          } 
        }

        function renderMap(){
          try{
            //var d3plus = $window.d3plus;
              d3plus.viz()
                .container(d3selectContainer)        
                .data(vizData)        
                .coords({"value":geoData, "center":[10,0]}) //fix edge of Russia/Alaska
                .type("geo_map") 
                .legend(true)        
                .id({"value":["continent","isoa2", "country"], "mute": muteData, "solo": soloData})          
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
          //parseQuery();
          applyFilters();
          renderMap();
        });

        scope.$watch('filterParams', function(newVal, oldVal){
          filterParams = newVal;
          //parseQuery();
          applyFilters();
          renderMap();
        });
      }
    };
  });