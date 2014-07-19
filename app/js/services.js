'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', [])
    .value('TLV_COORDINATES', {latitude: 32.0622839, longitude: 34.7800341})
    .value('JERUSALEM_COORDINATES', {latitude: 31.7622839, longitude: 35.2100341})
    .value('DEFAULT_ZOOM', 14)
    .value('FIND_ME_DEFAULT_ZOOM', 15)

    .factory('snifService', ['$http', function ($http) {
        return {
            getSnifim: function (cb, error_cb) {

                $http({method: 'GET', url: 'http://localhost:8000/server/data/BranchListSummary.json'})
                    .success(cb)
                    .error(error_cb);
            },
            getSnifDetails: function (snifNumber, cb, error_cb) {

                if(snifNumber != 540){
                    error_cb({}, 404);
                    return;
                }

                $http({method: 'GET', url: 'http://localhost:8000/server/data/BranchDetails.json'})
                    .success(cb)
                    .error(error_cb);
            }
        }
    }]);
