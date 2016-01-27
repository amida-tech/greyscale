'use strict';

angular.module('greyscaleApp')
  .directive('mapViz', function ($window, greyscaleSurveySrv){
    return {
      restrict: 'E',
      templateUrl: 'views/directives/visualization.html',
      // scope: { //All data moved to directive instead of binding isolate scope from controller
      //   vizData: '=',
      //   geoData: '=',
      //   topics: '=',
      //   surveys: '=',
      //   filterParams: '=',
      //   filterOptions: '='
      // },
      
      link: function(scope, element, attrs){
        //Local variables for angular data digest cycle ($watch)
        var vizData = [];
        var geoData = [];
        var filterParams = {};

        //Filter params
        scope.filterParams = {
          topicSelected : null,
          subtopicSelected : {
            subtopic : null,
            category : null
          },
          questionSelected : null,
          mapQuery : ""
        };

        //Load geo coordinates and data
        $http.get("scripts/directives/resources/doingbiz_agg.json")
          .success(function(viz_data) {
            scope.vizData = viz_data;
            console.log($scope.vizData);

            var countrySet = new Set(); //account for same country/multi-year duplicates
            viz_data.agg.forEach(function(row){
              countrySet.add({"name":row.country, "isoa2":row.isoa2});
            });
            scope.topics = [...countrySet];
            console.log($scope.topics);

            $http.get("scripts/directives/resources/world110-m3.json")
              .success(function(geo_data){
                scope.geoData = geo_data;
                console.log($scope.geoData);
              })
              .error(function(err){
                console.log(err);
              });
          })
          .error(function(err) {
            console.log(err);
          });

        //Mocked survey data --> look @ Mike's format
        scope.surveys = [
          {
            "qid":"1234",
            "text":"question1"
          },
          {
            "qid":"5678",
            "text":"question2"
          }
        ];

        scope.filterOptions = {
          subtopics : [
            {
              "id":"3333",
              "name":"Income"
            },
            {
              "id":"424",
              "name":"Region" //allow for user-specified region mapping
            },
            {
              "id":"111",
              "name":"Continent"
            }
          ],
          continents : [
            {
              "name":"Africa",
              "isoa2":"AF"
            },
            {
              "name":"Europe",
              "isoa2":"EU"
            },
            {
              "name":"North America",
              "isoa2":"NA"
            },
            {
              "name":"Asia",
              "isoa2":"AS",
            },
            {
              "name":"South America",
              "isoa2":"SA"
            },
            {
              "name":"Australia",
              "isoa2":"AU"
            },
            {
              "name":"Antartica",
              "isoa2":"AQ"
            }
          ],
          //TODO: pull official groupings from somewhere
          incomeLevels : [
            {
              "name":"Low-income",
              "countries":["AF","DZ"]
            },
            {
              "name":"Middle-income",
              "countries": ["AZ","MX"]
            },
            {
              "name":"High-income",
              "countries":["US","FR","DE"]
            }
          ]
        };

        var soloData = [];
        var muteData = ["AM", "ZA", "MZ"]; //hack so names don't render huge

        //var d3 = $window.d3; <-- zooming doesn't work when services used
        var d3selectContainer = d3.select(element.find('svg')[0]);

        //Non-essential
        // function parseQuery(){
        //   if(filterParams.mapQuery == "") { return filterParams.mapQuery };
        //   //Turn query string into json object
        //   var keyValPairs = filterParams.mapQuery.split(" ");

        // }

        // d3plus solo/mute filtering options (instead of modifying vizData)
        function applyFilters(){
          try{
            filterParams.topicSelected.forEach(function(country){
              soloData.push(country.isoa2);
            });
            vizData.forEach(function(row){
              var category = filterParams.subtopicSelected.category;
              switch(filterParams.subtopicSelected.subtopic.name){
                case "Continent":
                  if(row.continent==category.isoa2){
                    soloData.push(row.isoa2);
                  }
                  break;
                case "Income":
                  var incomeBracket = [];
                  filterOptions.incomeLevels.forEach(function(lvl){
                    if(lvl.name==category){
                      incomeBracket=lvl.countries;
                    }
                  });
                  if(incomeBracket.indexOf(row.isoa2)){
                    soloData.push(row.isoa2);
                  }
                  break;
                case "Region": //Condense repeated code into helper function once region-spec implemented
                  var regionGroup = [];
                  filterOptions.regions.forEach(function(reg){
                    if(reg.name==category){
                      regionGroup = reg.countries;
                    }
                  });
                  if(incomeBracket.indexOf(row.isoa2)){
                    soloData.push(row.isoa2);
                  }
                  break;
                default:
                  break;
              }
            });
          } catch(e) {
            console.log(e);
          } 
        }

        function renderMap(){
            //parseQuery();
            applyFilters();
            var layout = {
              autosize: true,
              
            }
        }

        scope.$watchGroup(['vizData', 'geoData'], function(newVals, oldVals){
          vizData = newVals[0].agg;
          geoData = newVals[1];
          renderMap();
        });

        scope.$watch('filterParams', function(newVal, oldVal){
          console.log(newVal);
          filterParams = newVal;
          renderMap();
        });
      }
    };
  });