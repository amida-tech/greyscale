'use strict';

angular.module('greyscaleApp')
  .directive('mapViz', function ($window, $http, greyscaleSurveySrv) {
    return {
      restrict: 'E',
      templateUrl: 'views/directives/visualization.html',
      //no isolate scope for data binding, all data moved from controller to directive
      link: function (scope, element, attrs) {
        //Load geo coordinates and data
        var request = $http.get('scripts/directives/resources/doingbiz_agg.json')
          .success(function (vizData) {
            scope.vizData = vizData.agg;

            var countrySet = new Set(); //account for same country/multi-year duplicates
            vizData.agg.forEach(function (row, index) {
              countrySet.add({
                'name': row.country,
                'isoa2': row.isoa2,
                'continent': row.continent,
                'id': index
              });
            });
            scope.topics = [...countrySet];
            return vizData.agg;
          })
          .error(function (err) {
              console.log(err);
          });

        //Defaults for UI
        scope.minDate = new Date(2015, 1, 1);
        scope.maxDate = new Date(2016, 1, 1);
        scope.open1 = function () {
          scope.popup1.opened = true;
        };
        scope.popup1 = {
          opened: false
        };
        scope.open2 = function () {
          scope.popup2.opened = true;
        };
        scope.popup2 = {
          opened: false
        };
        //Mocked survey data --> look @ Mike's format
        scope.users = ['user1', 'user2', 'user3'];

        scope.filterForm.topicSelected = [];

        scope.surveys = [{
          'qid': '1234',
          'text': 'question1'
        }, {
          'qid': '5678',
          'text': 'question2'
        }];

        scope.filterOptions = {
          subtopics: [{
            'id': '3333',
            'name': 'Income'
          }, {
            'id': '424',
            'name': 'Region' //allow for user-specified region mapping
          }, {
            'id': '111',
            'name': 'Continent'
          }],
          continents: [{
            'name': 'Africa',
            'isoa2': 'AF'
          }, {
            'name': 'Europe',
            'isoa2': 'EU'
          }, {
            'name': 'North America',
            'isoa2': 'NA'
          }, {
            'name': 'Asia',
            'isoa2': 'AS',
          }, {
            'name': 'South America',
            'isoa2': 'SA'
          }, {
            'name': 'Australia',
            'isoa2': 'AU'
          }, {
            'name': 'Antartica',
            'isoa2': 'AQ'
          }],
            //TODO: pull official groupings (incomes+regions) from somewhere
          incomeLevels: [{
            'name': 'Low-income',
            'countries': ['AF', 'DZ']
          }, {
            'name': 'Middle-income',
            'countries': ['AZ', 'MX']
          }, {
            'name': 'High-income',
            'countries': ['US', 'FR', 'DE']
          }],
          regions: []
        };
                
        request.then(function (data) {
          applyFilters(data, function (filteredData) {
            renderMap(filteredData);
          });
        });

        function applyFilters(data, callback){
          //Handles case when data has not been narrowed, only variable changed
          //length==0 because topicSelected ng-multi-select not registering as dirty (TODO)
          if(scope.filterForm.$pristine && scope.filterForm.topicSelected.length==0){
            console.log("in if");
            callback(scope.vizData);
            
          } else if (scope.filterForm.subtopicSelected==null && scope.filterForm.topicSelected.length==0){
            console.log("in else if");
            callback(scope.vizData);
          } else {
            console.log("in else");
            var filteredVizData =[];
            scope.vizData.forEach(function(row){
              if(scope.filterForm.topicSelected){
                scope.filterForm.topicSelected.forEach(function(topic){
                  if(topic.isoa2==row.isoa2){
                    filteredVizData.push(row);
                  }
                });
              }
              if(scope.filterForm.subtopicSelected.subtopic){
                var subtopicObj = scope.filterForm.subtopicSelected;
                if(subtopicObj.subtopic.name==="Continent"){
                  if(row.continent==subtopicObj.category.isoa2){
                      filteredVizData.push(row);
                    }
                } else { //Region or Income - fields that have name/countries grouping
                  if(subtopicObj.category.countries.indexOf(row.isoa2)>-1){
                    filteredVizData.push(row);
                  }
                }
              }
            });
            console.log(filteredVizData); 
            callback(filteredVizData);
          }
        }

        function getMapParams(){
          //start with default
          var params = {
            graphTitle: "Doing Business 2016",
            scaleTitle: "Rank",
            geoScope: "world",
            showcoastlines: false
          };
          if(scope.filterForm.$pristine && scope.filterForm.topicSelected.length==0){ return params; }
          if(scope.filterForm.variableSelected){
            params.scaleTitle = (scope.variableSelected==="rank") ? "Rank" : "DTF (frontier=100)";
            params.graphTitle+=("- "+params.scaleTitle);
          }
          var topicArray = scope.filterForm.topicSelected;
          if(topicArray.length!=0){
            params.showcoastlines = true;
            var topicNames = topicArray.map(function(topic){ return topic.name; });
            params.graphTitle+=("\n"+ topicNames.join());
            //Single country - zoom into continent, usa scope built into Plotly
            if(topicArray.length===1){
              params.geoScope = (topicArray[0].isoa2 === "US") ?
                                "usa" : scope.topicSelected.continent;
            //Multiple countries - check from same continent
            } else {
              console.log("checking if all same continent");
              var continentCode = String(topicArray[0].continent);
              var allSameContinent = topicArray.every(function(currentTopic){
                return String(currentTopic.continent)==continentCode;
              });
              if(allSameContinent){
                var fullContinentName = scope.filterOptions.continents.filter(function(cont){
                  return (cont.isoa2==continentCode);
                });
                console.log(fullContinentName);
                params.geoScope = fullContinentName[0].name.toLowerCase();
              }
            }
          }
          //Entire continent selected - zoom into continent
          if(scope.filterForm.subtopicSelected){
            params.showcoastlines = true;
            params.graphTitle+=("\n"+ scope.filterForm.subtopicSelected.subtopic.name + " - " + scope.filterForm.subtopicSelected.category.name);
            if(scope.filterForm.subtopicSelected.subtopic.name=="Continent"){
                params.geoScope = scope.filterForm.subtopicSelected.category.name.toLowerCase();
            }
          }
          return params;
        }

        function renderMap(plotData){

          function unpackData(rows, key){
              return rows.map(function(row){ return row[key];});
          }
          var plotVar = (scope.filterForm.variableSelected) ? scope.filterForm.variableSelected : 'rank';

          var mapParams = getMapParams();

          var mapData = [{
            type: 'choropleth',
            locationmode: 'country names',
            locations: unpackData(plotData, 'country'),
            z: unpackData(plotData, plotVar),
            text: unpackData(plotData, 'country'),
            autocolorscale: true,
            colorbar: {
              title: mapParams.scaleTitle,
              thickness: 0.75,
              len: 0.75,
              xpad: 30
            }
          }];

          var layout = {
            title: mapParams.graphTitle, //Make subtitle from filter selection
            geo: {
              projection: {
                type: 'mercator'
              },
              resolution: '50',
              showframe: false,
              showcoastlines: mapParams.showcoastlines,
              scope: mapParams.geoScope
            },
            width: 700,
            height: 700
          };
          Plotly.newPlot('mapViz', mapData, layout, {showLink:false}); 
        }

        scope.drawMap = function(){ 
          applyFilters(scope.vizData, function (result){
            renderMap(result);
          }); 
        };

        scope.resetFilters = function(){
          scope.filterForm.topicSelected = "";
          scope.filterForm.subtopicSelected = "";
          scope.filterForm.$setPristine();
        }

        scope.$watch('vizData', function (newVal, oldVal){
          if(newVal!==oldVal){
            applyFilters(scope.vizData, function(result){
              renderMap(result);
            }); 
          }
        });
      }
    }
  });
