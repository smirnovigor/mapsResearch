'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
    .controller('GoogleMapCtrl', ['$scope', 'snifService', '$modal', function ($scope, snifService, $modal) {

        $scope.isFindMe = false;
        $scope.fireStreetView = false;

        $scope.selected = {};

        $scope.toggleFindMe = function () {
            $scope.isFindMe = !$scope.isFindMe;
        }

        $scope.setSelected = function (selected) {
            $scope.selected = selected;
        }

        $scope.formatModel = function($model){
            return (typeof $model !== 'undefined' && $model.shemSnif) ? $model.shemSnif : null;
        }

        $scope.searchSelect = function($item, $model, $label){
            $scope.setSelected($item);
        }

        $scope.showBranchDetails = function () {

            snifService.getSnifDetails($scope.selected.snifNumber ,getSnifDetailsSuccess, getSnifDetailsError);

            function getSnifDetailsSuccess(data, status, headers, config) {

                data.serviceResponse.openingHours = data.serviceResponse.openingHours.split('\r');
                data.serviceResponse.snifServices = data.serviceResponse.snifServices.split('\r\n');
                openModal(data.serviceResponse, true);
            }

            function getSnifDetailsError(data, status, headers, config) {

                openModal($scope.selected, false);

                console.log("There is no details for current barnch. Status " + status);
            }
        }

        function openModal(branch, isFullDataAttr){
            var modalInstance = $modal.open({
                templateUrl: 'moreInfoModal.html',
                controller: 'ModalInstanceCtrl',
                resolve: {
                    branch: function(){
                        return branch;
                    },
                    isFullData: function(){
                        return isFullDataAttr;
                    }
                }
            });
        }

        $scope.showStreetView = function () {
            $scope.fireStreetView = true;
        }

        snifService.getSnifim(getSnifimSuccess, getSnifimError);

        function getSnifimSuccess(data, status, headers, config) {

            $scope.snifim = data.serviceResponse.branchInfoList
                .filter(function (elem) {
                    return elem.longitude && elem.latitude && elem.longitude != 0 && elem.latitude != 0
                });
        }

        function getSnifimError(data, status, headers, config) {
            console.log("getSnifim is failed whit status " + status);
        }

    }])
    .controller('ModalInstanceCtrl', ['$scope', '$modalInstance', 'branch', 'isFullData', function ($scope, $modalInstance, branch, isFullData) {
        $scope.branch = branch;
        $scope.isFullData = isFullData;

        $scope.close = function () {
            $modalInstance.close();
        };
    }])
    .controller('OpenstreetMapCtrl', [function () {

    }])
    .controller('LeafletMapCtrl', [function () {

    }])
    .controller('EsriMapCtrl', [function () {

    }])
    .controller('CompareCtrl', [function () {

    }]);