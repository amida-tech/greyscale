/**
 * Created by jsachs on 18.01.16
 *
 * @ngdoc function
 * @name greyscaleApp.controller:VisualizationCtrl
 * @description
 * # VisualizationCtrl
 * Controller of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp').controller('VisualizationCtrl', function ($http, $scope, greyscaleSurveySrv) {

    $scope.model = {
    //   vizData : JSON.parse("scripts/directives/resources/doingbiz_agg.json"),
    //   geoData : JSON.parse("scripts/directives/resources/world110-m3.json") <-JSON formatting errors
    };

    //MOVED TO DIRECTIVE
    // $scope.filterParams = {
    //       topicSelected : null,
    //       subtopicSelected : {
    //         subtopic : null,
    //         category : null
    //       },
    //       questionSelected : null,
    //       mapQuery : ""
    //     };

    // $http.get("scripts/directives/resources/doingbiz_agg.json")
    //   .success(function(viz_data) {
    //     $scope.vizData = viz_data;
    //     console.log($scope.vizData);

    //     var countrySet = new Set(); //account for same country/multi-year duplicates
    //     viz_data.agg.forEach(function(row){
    //       countrySet.add({"name":row.country, "isoa2":row.isoa2});
    //     });
    //     $scope.topics = [...countrySet];
    //     console.log($scope.topics);

    //NO LONGER NEEDED, BUILT INTO PLOTLY.JS
    //     $http.get("scripts/directives/resources/world110-m3.json")
    //       .success(function(geo_data){
    //         $scope.geoData = geo_data;
    //         console.log($scope.geoData);
    //       })
    //       .error(function(err){
    //         console.log(err);
    //       });
    //   })
    //   .error(function(err) {
    //     console.log(err);
    //   });

    //Pull Indaba survey data
    // greyscaleSurveySrv.list().then(function (data) {
    //     scope.surveys = data;
    // });

    //TODO: write function that pulls data from survey format into scope attrs

    //MOVED TO DIRECTIVE

    //Mocked survey data --> look @ Mike's format
    // $scope.surveys = [
    //   {
    //     "qid":"1234",
    //     "text":"question1"
    //   },
    //   {
    //     "qid":"5678",
    //     "text":"question2"
    //   }
    // ];

    // $scope.filterOptions = {
    //   subtopics : [
    //     {
    //       "id":"3333",
    //       "name":"Income"
    //     },
    //     {
    //       "id":"424",
    //       "name":"Region" //allow for user-specified region mapping
    //     },
    //     {
    //       "id":"111",
    //       "name":"Continent"
    //     }
    //   ],
    //   continents : [
    //     {
    //       "name":"Africa",
    //       "isoa2":"AF"
    //     },
    //     {
    //       "name":"Europe",
    //       "isoa2":"EU"
    //     },
    //     {
    //       "name":"North America",
    //       "isoa2":"NA"
    //     },
    //     {
    //       "name":"Asia",
    //       "isoa2":"AS",
    //     },
    //     {
    //       "name":"South America",
    //       "isoa2":"SA"
    //     },
    //     {
    //       "name":"Australia",
    //       "isoa2":"AU"
    //     },
    //     {
    //       "name":"Antartica",
    //       "isoa2":"AQ"
    //     }
    //   ],
    //   //TODO: pull official groupings from somewhere
    //   incomeLevels : [
    //     {
    //       "name":"Low-income",
    //       "countries":["AF","DZ"]
    //     },
    //     {
    //       "name":"Middle-income",
    //       "countries": ["AZ","MX"]
    //     },
    //     {
    //       "name":"High-income",
    //       "countries":["US","FR","DE"]
    //     }
    //   ]
    // };
  });
