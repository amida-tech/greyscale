'use strict';

angular.module('greyscaleApp')
.service('PmProjectsWidgetSrv', function(greyscaleProfileSrv, greyscaleEntityTypeRoleApi){
    return {
        getProjects: _loadProjects
    };

    function _loadProjects() {
        return greyscaleProfileSrv.getProfile()
            .then(_loadPmProjectEntities)
            .then(_extractProjects);
    }

    function _loadPmProjectEntities(user) {
        return greyscaleEntityTypeRoleApi.list({
            essenceId: 13, // projects,
            roleId: 9, // PM
            userId: user.id
        })
    }

    function _extractProjects(entities) {
        var projects = [];
        angular.forEach(entities, function(entity){
            var project = entity.entity;
            projects.push(project);
        });
        return projects;
    }

})
.controller('PmProjectsWidgetCtrl', function($scope, PmProjectsWidgetSrv, greyscaleProjectApi, $q){

    $scope.model = {};

    PmProjectsWidgetSrv.getProjects()
        .then(_getProjectProducts)
        .then(function(projects){
            $scope.model.projects = projects;
        });

    function _getProjectProducts(projects) {
        var req = [];
        angular.forEach(projects, function(project){
            req.push(greyscaleProjectApi.productsList(project.id));
        });
        return $q.all(req)
            .then(function(promises){
                angular.forEach(promises, function(products, i){
                    projects[i].products = products;
                });
                return projects;
            });
    }



});
