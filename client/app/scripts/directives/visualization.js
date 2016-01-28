'use strict';

angular.module('greyscaleApp')
  .directive('mapViz', function ($window, $http, greyscaleSurveySrv){
    return {
      restrict: 'E',
      templateUrl: 'views/directives/visualization.html',
      //no isolate scope for data binding, all data moved from controller to directive
      link: function(scope, element, attrs){

        //Local variables for angular data digest cycle ($watch)
        var vizData = [];

        //Load geo coordinates and data
        $http.get("scripts/directives/resources/doingbiz_agg.json")
          .success(function(viz_data) {
            scope.vizData = viz_data.agg;
            console.log(scope.vizData);

            var countrySet = new Set(); //account for same country/multi-year duplicates
            viz_data.agg.forEach(function(row){
              countrySet.add({"name":row.country, "isoa2":row.isoa2});
            });
            scope.topics = [...countrySet];
            console.log(scope.topics);
          })
          .error(function(err) {
            console.log(err);
          });

        //Mocked survey data --> look @ Mike's format
        scope.users = ["user1", "user2", "user3"];

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
          //TODO: pull official groupings (incomes+regions) from somewhere
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
          ],
          regions : []
        };

        
        function applyFilters(callback){
          console.log("in applyFilters");
          if(scope.filterForm.$pristine){
            console.log("in if block");
            callback(vizData);
          } else if(scope.filterForm.topic==null && scope.filterForm.subtopic==null) {
            console.log("else if block");
            callback(vizData);
          } else {
            console.log("in else block");
            var filteredVizData =[];
            vizData.forEach(function(row){
              if(scope.filterForm.topicSelected){
                console.log("topicSelected block");
                scope.filterForm.topicSelected.forEach(function(topic){
                  if(topic.isoa2==row.isoa2){
                    filteredVizData.push(row);
                  }
                });
              }
              if(scope.filterForm.subtopicSelected){
                var subtopicObj = scope.filterForm.subtopicSelected;
                switch(subtopicObj.subtopic.name){
                  case "Continent":
                    if(row.continent==subtopicObj.category.isoa2){
                      filteredVizData.push(row);
                    }
                    break;
                  case "Income":
                    if(subtopicObj.category.countries.indexOf(row.isoa2)>-1){
                      filteredVizData.push(row);
                    }
                    break;
                  case "Region": 
                    if(subtopicObj.category.countries.indexOf(row.isoa2)>-1){
                      filteredVizData.push(row);
                    }
                    break;
                  default:
                    break;
                };
              }
            }); 
            callback(filteredVizData);
          }
        }

        function renderMap(plotData){
          console.log(plotData);
          function unpackData(rows, key){
              return rows.map(function(row){ return row[key]});
          }
          var plotVar = (scope.filterForm.variableSelected) ? scope.filterForm.variableSelected : 'rank';
          console.log(plotVar);
          var mapData = [{
            type: 'choropleth',
            locationmode: 'country names',
            locations: unpackData(plotData, 'country'),
            z: unpackData(plotData, plotVar),
            text: unpackData(plotData, 'country'),
            autocolorscale: true,
            colorbar: {
              title: plotVar,
              thickness: 0.75,
              len: 0.75,
              xpad: 30
            }
          }];

          var layout = {
            title: 'Doing Business 2016', //Make subtitle from filter selection
            geo: {
              showframe: false,
              showcoastlines: false,
              projection:{
                  type: 'mercator'
              }
            //   resolution: '50',
            },
            width: 700,
            height: 700, //weird gaps
            // margin: {
            //   l: 80,
            //   r: 80,
            //   t: 100,
            //   b: 40
            // }
          };
          Plotly.newPlot('mapViz', mapData, layout, {showLink:false}); 
        }

        scope.drawMap = function(){ 
          applyFilters(function(result){
            renderMap(result);
          }); 
        };

        scope.$watch('vizData', function(newVal, oldVal){
          vizData = newVal;
          applyFilters(function(result){renderMap(result)});
        });
      }
    }
  });