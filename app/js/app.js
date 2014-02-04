'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
        'ngRoute',
        'myApp.filters',
        'myApp.services',
        'myApp.directives',
        'myApp.controllers',
        'ui.bootstrap'
    ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/googleMap', {templateUrl: 'partials/googleMap.html', controller: 'GoogleMapCtrl'});
        $routeProvider.when('/openstreetMap', {templateUrl: 'partials/openstreetMap.html', controller: 'OpenstreetMapCtrl'});
        $routeProvider.when('/leafletMap', {templateUrl: 'partials/leafletMap.html', controller: 'LeafletMapCtrl'});
        $routeProvider.when('/esriMap', {templateUrl: 'partials/esriMap.html', controller: 'EsriMapCtrl'});
        $routeProvider.when('/compare', {templateUrl: 'partials/compare.html', controller: 'CompareCtrl'});
        $routeProvider.otherwise({redirectTo: '/googleMap'});
    }])
    .run(['$templateCache', function($templateCache){
        $templateCache.put('infoWindowTemplate.html', [
            '<div class="gm-iw" style="height: 97px;">',
                '<div class="gm-title text-right">{{selected.city}}, <strong>סניף </strong>{{selected.snifNumber}} - {{selected.shemSnif}}</div>',
                '<div class="gm-photos">',
                    '<span class="gm-wsv">',
                        '<div class="crop">',
                            '<img ng-click="showStreetView()" ng-src="http://maps.googleapis.com/maps/api/streetview?sensor=false&size=210x180&heading=34&pitch=10&location={{selected.latitude}},{{selected.longitude}}">',
                        '</div>',
                        '<label class="gm-sv-label">Street View</label>',
                    '</span>',
                '</div>',
                '<div class="gm-rev pull-right">',
                    '<span class="btn btn-info btn-xs" ng-click="showBranchDetails()"><i class="glyphicon glyphicon-info-sign"></i> more info</span>',
                '</div>',
            '</div>'
        ].join(''));


        $templateCache.put('moreInfoModal.html', [
            '<div class="modal-header">',
                "<h3>Branch details</h3>",
            '</div>',
            '<div class="modal-body">',
                '<ul ng-if="isFullData">',
                    '<li><span><strong>shemSnif:</strong> {{branch.shemSnif}}</span></li>',
                    '<li><span><strong>misparSnif:</strong> {{branch.misparSnif}}</span></li>',
                    '<li><span><strong>address:</strong> {{branch.address}}</span></li>',

                    '<li><span><strong>openingHours:</strong></span><ul>',
                        '<li ng-repeat="openHour in branch.openingHours">{{openHour}}</li>',
                    '</ul></li>',

                    '<li><span><strong>snifManager:</strong> {{branch.snifManager}}</span></li>',

                    '<li><span><strong>snifServices:</strong></span><ul>',
                        '<li ng-repeat="snifService in branch.snifServices">{{snifService}}</li>',
                    '</ul></li>',

                    '<li><span><strong>telephone:</strong> {{branch.telephone}}</span></li>',
                    '<li><span><strong>fax:</strong> {{branch.fax}}</span></li>',
                '</ul>',
                '<ul ng-if="!isFullData">',
                    '<li><span><strong>shemSnif:</strong> {{branch.shemSnif}}</span></li>',
                    '<li><span><strong>snifNumber:</strong> {{branch.snifNumber}}</span></li>',
                    '<li><span><strong>city:</strong> {{branch.city}}</span></li>',
                    '<li><span><strong>street:</strong> {{branch.street}}</span></li>',
                    '<li><span><strong>houseNum:</strong> {{branch.houseNum}}</span></li>',
                '</ul>',
            '</div>',
            '<div class="modal-footer">',
                '<button class="btn btn-warning" ng-click="close()">Close</button>',
            '</div>'
        ].join(''));
    }]);
