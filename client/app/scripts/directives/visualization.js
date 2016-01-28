'use strict';

angular.module('greyscaleApp')
  .directive('mapViz', function ($window, $http, greyscaleSurveySrv){
    return {
      restrict: 'E',
      templateUrl: 'views/directives/visualization.html',
      //no isolate scope for data binding, all data moved from controller to directive
      link: function(scope, element, attrs){
        //Load geo coordinates and data
        var request = $http.get("scripts/directives/resources/doingbiz_agg.json")
          .success(function(viz_data) {
            scope.vizData = viz_data.agg;
            console.log(scope.vizData);

            var countrySet = new Set(); //account for same country/multi-year duplicates
            viz_data.agg.forEach(function(row){
              countrySet.add({"name":row.country, "isoa2":row.isoa2});
            });
            scope.topics = [...countrySet];
            console.log(scope.topics);
            return viz_data.agg;
          })
          .error(function(err) {
            console.log(err);
          });

        //Defaults for UI
        scope.minDate = new Date(2015, 1, 1);
        scope.maxDate = new Date(2016, 1, 1);
        scope.open1 = function() {
          scope.popup1.opened = true;
        };
        scope.popup1 = { opened: false};
        scope.open2 = function() {
          scope.popup2.opened = true;
        };
        scope.popup2 = { opened: false};

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

        
        function applyFilters(data, callback){
          console.log("in applyFilters");
          if((scope.filterForm.$pristine) ||(scope.topicSelected==null&&scope.subtopicSelected==null)){
            console.log("in if block");
            callback(scope.vizData);
          } else {
            console.log("in else block");
            var filteredVizData =[];
            scope.vizData.forEach(function(row){
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

        request.then(function(data){
          applyFilters(data, function(filteredData){
            renderMap(filteredData);
          })
        })
        function formatTitles(){
          //start with default
          var titles = {
            graphTitle: "Doing Business 2016",
            scaleTitle: "Rank"
          };
          if(scope.filterForm.variableSelected){
            titles.scaleTitle = (scope.variableSelected=="rank") ? "Rank" : "DTF (frontier=100)";
          }
          
          return titles;
        }

        function renderMap(plotData){
          console.log(plotData);

          function unpackData(rows, key){
              return rows.map(function(row){ return row[key]});
          }
          var plotVar = (scope.filterForm.variableSelected) ? scope.filterForm.variableSelected : 'rank';
          console.log(plotVar);

          //var titleObj = formatTitles();

          var mapData = [{
            type: 'choropleth',
            locationmode: 'country names',
            locations: unpackData(plotData, 'country'),
            z: unpackData(plotData, plotVar),
            text: unpackData(plotData, 'country'),
            autocolorscale: true,
            colorbar: {
              title: "Rank",
              thickness: 0.75,
              len: 0.75,
              xpad: 30
            }
          }];

          var layout = {
            title: 'Doing Business 2016', //Make subtitle from filter selection
            geo: {
              projection: {
                type: 'mercator'
              },
              resolution: '50',
              showframe: false,
              showcoastlines: false
            },
            width: 700,
            height: 700
          };
          Plotly.newPlot('mapViz', mapData, layout, {showLink:false}); 
        }

        scope.drawMap = function(){ 
          applyFilters(scope.vizData, function(result){
            renderMap(result);
          }); 
        };

        scope.$watch('vizData', function(newVal, oldVal){
          if(!newVal===oldVal){
            applyFilters(scope.vizData, function(result){renderMap(result)}); 
          }
        });
      }
    }
  });