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

angular.module('greyscaleApp').controller('VisualizationCtrl', function ($http, $scope) {

    // $scope.model = {
    //   vizData : JSON.parse("scripts/directives/resources/doingbiz_agg.json"),
    //   geoData : JSON.parse("scripts/directives/resources/world110-m3.json")
    // };

    $http.get("scripts/directives/resources/doingbiz_agg.json")
      .success(function(viz_data) {
        $scope.vizData = viz_data;
        console.log($scope.vizData);

        $http.get("scripts/directives/resources/world110-m3.json")
          .success(function(geo_data){
            $scope.geoData = geo_data;
            console.log($scope.geoData);
          })
          .error(function(err){
            console.log(err);
          });
      })
      .error(function(err) {
        console.log(err);
      });

    $scope.continents = [
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
    ];

    $scope.questions = [
      {
        "qid":"1234",
        "text":"question1"
      },
      {
        "qid":"5678",
        "text":"question2"
      }
    ];
  }]);
});
