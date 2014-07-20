'use strict';

/* Directives */


angular.module('myApp.directives', [])

    .directive('menuToggle', ['$location', function ($location) {

        return function (scope, elm, attrs) {

            //activate current section menu
            elm.find('li a[href$="' + $location.path() + '"]').parent().addClass('active');

            var liElems = elm.find('li');

            liElems.bind('click', function () {

                liElems.removeClass('active');
                jQuery(this).addClass('active');
            })
        };

    }])

    .directive("gooMaps", ['TLV_COORDINATES', 'DEFAULT_ZOOM', 'FIND_ME_DEFAULT_ZOOM', '$templateCache', '$compile',
        function (TLV_COORDINATES, DEFAULT_ZOOM, FIND_ME_DEFAULT_ZOOM, $templateCache, $compile) {

            return {
                restrict: 'E',
                priority: 10,
                scope: {
                    findMe: '=',
                    markers: '=',
                    selected: '=',
                    fireStreetView: '=',
                    templateName: '@'
                },
                replace: true,
                template: '<div id="gooMapsWrapper" style="height: 600px;"></div>',
                link: function (scope, elem, attrs) {


                    var mapOptions = {
                            minZoom: 9,
                            maxZoom: 19,
                            mapTypeControl: false,
                            streetViewControl: false,
                            panControl: true,
                            zoomControl: true
                        },
                        directionsService = new google.maps.DirectionsService(),
                        directionsRenderer = new google.maps.DirectionsRenderer({
                            markerOptions: {
                                visible: false
                            },
                            draggable: true
                        });

                    //initialize map
                    scope.map = new google.maps.Map(elem[0], mapOptions);


                    // WATCHERS
                    scope.$watch('findMe', findMeNavigation);
                    scope.$watch('markers', setMarkers);
                    scope.$watch('selected', selectSelected);
                    scope.$watch('fireStreetView', showStreetView);

                    function showStreetView() {

                        if (scope.fireStreetView) {
                            var panorama = scope.map.getStreetView();
                            panorama.setPosition(scope.markerInstances[getMarkerKey(scope.selected)].getPosition());
                            panorama.setPov({
                                heading: 34,
                                pitch: 10
                            });

                            panorama.setVisible(true);

                            scope.fireStreetView = false;
                        }
                    }

                    function selectSelected() {

                        //FIXME: somehow selected come undefined
                        if (typeof scope.selected === 'undefined' ||
                            typeof scope.selected.latitude === 'undefined' ||
                            typeof scope.selected.longitude === 'undefined') {
                            console.error('igor: scope.selected is undefined');
                            return;
                        }

                        showMarkerInfoWindow(scope.selected);
                    }

                    function setMarkers() {
                        scope.markerInstances = {};

                        angular.forEach(scope.markers, function (marker, index) {

                            var mouseoutTimeout;

                            //TODO: fix shemSnif reference, directive cannot know marker properties ( except lat, lon and title )
                            scope.markerInstances[getMarkerKey(marker)] = new google.maps.Marker({
                                map: scope.map,
                                position: new google.maps.LatLng(marker.latitude, marker.longitude),
                                icon: './img/Map-Marker-Marker-Outside-Azure-icon-32.png',
                                title: marker.shemSnif
                            });

                            //add mouseover effect
                            var mouseoverListener = google.maps.event.addListener(scope.markerInstances[getMarkerKey(marker)], 'mouseover', function () {

                                //cancel mouseout event
                                if (mouseoutTimeout) {
                                    clearTimeout(mouseoutTimeout);
                                }
                                scope.markerInstances[getMarkerKey(marker)].setIcon('./img/Map-Marker-Marker-Outside-Chartreuse-icon-32.png');
                                scope.markerInstances[getMarkerKey(marker)].setAnimation(google.maps.Animation.BOUNCE);
                            });

                            //end mouseover effect
                            var mouseoutListener = google.maps.event.addListener(scope.markerInstances[getMarkerKey(marker)], 'mouseout', function () {
                                //undo mouseover changes with delay, for better user experience
                                mouseoutTimeout = setTimeout(function () {
                                    makeMarkerAsUnshowed(marker);
                                }, 1000);
                            });

                            //add click effect - open info window
                            google.maps.event.addListener(scope.markerInstances[getMarkerKey(marker)], 'click', function () {

                                //cancel mouseout event
                                if (mouseoutTimeout) {
                                    clearTimeout(mouseoutTimeout);
                                }
                                google.maps.event.removeListener(mouseoverListener);
                                google.maps.event.removeListener(mouseoutListener);

                                if (scope.findMe) {
                                    showDirection(marker);
                                }

                                showMarkerInfoWindow(marker);
                            });
                        });
                    }


                    function getMarkerKey(marker) {
                        return marker.latitude.toString() + marker.longitude.toString();
                    }

                    function showMarkerInfoWindow(marker) {
                        scope.selected = marker;

                        makeMarkerAsShowed(marker);

                        scope.infoWindow = scope.infoWindow || new google.maps.InfoWindow();

                        scope.infoWindow.setContent(getContent());

                        scope.infoWindow.open(scope.map, scope.markerInstances[getMarkerKey(marker)]);

                        //set center to clicked marker
                        scope.map.panTo(scope.markerInstances[getMarkerKey(marker)].getPosition());

                        google.maps.event.clearInstanceListeners(scope.infoWindow);

                        //on close info window, set selected to null
                        google.maps.event.addListener(scope.infoWindow, 'closeclick', function () {
                            scope.selected = null;
                        })
                    }

                    function makeMarkerAsShowed(marker) {
                        scope.markerInstances[getMarkerKey(marker)].setIcon('./img/Map-Marker-Marker-Outside-Chartreuse-icon-32.png');
                        scope.markerInstances[getMarkerKey(marker)].setAnimation();
                    }

                    function makeMarkerAsUnshowed(marker) {
                        scope.markerInstances[getMarkerKey(marker)].setIcon('./img/Map-Marker-Marker-Outside-Azure-icon-32.png');
                        scope.markerInstances[getMarkerKey(marker)].setAnimation();
                    }

                    function showDirection(marker) {
                        var request = {
                            origin: scope.findMeMarker.getPosition(),
                            destination: scope.markerInstances[getMarkerKey(marker)].getPosition(),
                            travelMode: google.maps.TravelMode.DRIVING
                        };

                        directionsService.route(request, function (result, status) {
                            if (status == google.maps.DirectionsStatus.OK) {
                                directionsRenderer.setMap(scope.map);
                                directionsRenderer.setDirections(result);
                            }
                        });
                    }

                    function findMeNavigation() {

                        if (scope.findMe && navigator.geolocation) {

                            navigator.geolocation.getCurrentPosition(function (position) {

                                    scope.findMeMarker = scope.findMeMarker || new google.maps.Marker({
                                        map: scope.map,
                                        position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
                                        icon: './img/street-view-48.png'
                                    });

                                    if (scope.selected && scope.selected.latitude && scope.selected.longitude) {
                                        showDirection(scope.selected);
                                    }
                                    else {
                                        scope.map.setCenter(scope.findMeMarker.getPosition());
                                        scope.map.setZoom(FIND_ME_DEFAULT_ZOOM);
                                    }

                                    scope.findMeMarker.setVisible(true);
                                },
                                function () {
                                    scope.map.setCenter(new google.maps.LatLng(TLV_COORDINATES.latitude, TLV_COORDINATES.longitude));
                                    console.log('There is no geo location enabled.')
                                })
                        }
                        else {
                            if (scope.findMeMarker) {
                                scope.findMeMarker.setVisible(false);
                                directionsRenderer.setMap(null);
                            }

                            scope.map.setCenter(new google.maps.LatLng(TLV_COORDINATES.latitude, TLV_COORDINATES.longitude));
                            scope.map.setZoom(DEFAULT_ZOOM);
                        }
                    }

                    function getContent() {

                        //attach parent scope to given template
                        var parentScope = scope.$parent;

                        if ($templateCache.get(scope.templateName)) {
                            var $html = $compile($templateCache.get(scope.templateName))(parentScope);

                            parentScope.$apply();

                            return $html[0];
                        }
                        else {
                            return '<span>Sorry, no content.</span>'
                        }

                    }
                }
            }
        }])
    .directive("esriMaps", ['TLV_COORDINATES', 'DEFAULT_ZOOM', 'FIND_ME_DEFAULT_ZOOM',
        function (TLV_COORDINATES, DEFAULT_ZOOM, FIND_ME_DEFAULT_ZOOM) {

            return {
                restrict: 'E',
                priority: 10,
                scope: {
                    findMe: '=',
                    markers: '=',
                    selected: '='
                },
                replace: true,
                template: '<div id="esriMapsWrapper" style="height: 600px;"></div>',
                link: function (scope, elem, attrs) {


                    var mapOptions = {
                        center: [TLV_COORDINATES.longitude, TLV_COORDINATES.latitude],
                        zoom: DEFAULT_ZOOM,
                        basemap: "streets"
                    };

                    dojo.require("esri.map");
                    dojo.require("esri.dijit.LocateButton");

                    //initialize map
                    dojo.ready(function () {
                        var map = new esri.Map(elem[0], mapOptions);

                        var geoLocate = new esri.dijit.map({
                            map: map
                        }, "LocateButton");

                        geoLocate.startup();

                    })

                }
            }
        }])
    .directive("leafletMaps", ['TLV_COORDINATES', 'DEFAULT_ZOOM', 'FIND_ME_DEFAULT_ZOOM',
        function (TLV_COORDINATES, DEFAULT_ZOOM, FIND_ME_DEFAULT_ZOOM) {

            return {
                restrict: 'E',
                priority: 10,
                scope: {
                    findMe: '=',
                    markers: '=',
                    selected: '='
                },
                replace: true,
                template: '<div id="leafletMapsWrapper" style="height: 600px;"></div>',
                link: function (scope, elem, attrs) {

                    var mapOptions = {
                        center: [TLV_COORDINATES.latitude, TLV_COORDINATES.longitude],
                        zoom: DEFAULT_ZOOM
                    };

                    var map = L.map(elem[0], mapOptions);
                    //var map = L.map('leafletMapsWrapper').setView([TLV_COORDINATES.longitude, TLV_COORDINATES.latitude], DEFAULT_ZOOM);

                    L.tileLayer('http://{s}.tile.cloudmade.com/8ee2a50541944fb9bcedded5165f09d9/997/256/{z}/{x}/{y}.png', {
                        maxZoom: 18
                    }).addTo(map);

                    L.marker([TLV_COORDINATES.latitude, TLV_COORDINATES.longitude]).addTo(map)
                        .bindPopup("<b>Hello!</b> Your are here!").openPopup();

                    var popup = L.popup();

                    function onMapClick(e) {
                        popup
                            .setLatLng(e.latlng)
                            .setContent("You clicked the map at " + e.latlng.toString())
                            .openOn(map);
                    }

                    map.on('click', onMapClick);
                }
            }
        }])
    .directive("openLayersMaps", ['TLV_COORDINATES', 'DEFAULT_ZOOM', 'FIND_ME_DEFAULT_ZOOM',
        function (TLV_COORDINATES, DEFAULT_ZOOM, FIND_ME_DEFAULT_ZOOM) {

            return {
                restrict: 'E',
                priority: 10,
                scope: {
                    findMe: '=',
                    markers: '=',
                    selected: '='
                },
                replace: true,
                template: '<div id="openLayersWrapper" style="height: 600px;"></div>',
                link: function (scope, elem, attrs) {

//                    var map = new OpenLayers.Map('openLayersWrapper');
//
//                    map.addLayer(new OpenLayers.Layer.OSM());
//
//                    var lonLat = new OpenLayers.LonLat(TLV_COORDINATES.longitude, TLV_COORDINATES.latitude)
//                        .transform(
//                            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
//                            map.getProjectionObject() // to Spherical Mercator Projection
//                        );
//
//                    var markers = new OpenLayers.Layer.Markers("Markers");
//                    map.addLayer(markers);
//
//                    var size = new OpenLayers.Size(32,32);
//                    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
//                    var icon = new OpenLayers.Icon('./img/Map-Marker-Marker-Outside-Azure-icon-32.png',size,offset);
//
//                    markers.addMarker(new OpenLayers.Marker(lonLat), icon);
//
//                    map.setCenter(lonLat, DEFAULT_ZOOM);

                        var map = new OpenLayers.Map('openLayersWrapper');

                        map.addLayer(new OpenLayers.Layer.OSM());

                        var lonLat = new OpenLayers.LonLat(TLV_COORDINATES.longitude, TLV_COORDINATES.latitude)
                            .transform(
                                new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
                                map.getProjectionObject() // to Spherical Mercator Projection
                            );



                        var markers = new OpenLayers.Layer.Markers( "Markers" );
                        map.addLayer(markers);

                        var marker = new OpenLayers.Marker();
                        var size = new OpenLayers.Size(32,32);
                        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
                        var icon = new OpenLayers.Icon('./img/Map-Marker-Marker-Outside-Azure-icon-32.png',size,offset);
                        marker.icon = icon;
                        marker.lonlat = lonLat;
                        markers.addMarker(marker);

                        map.setCenter(lonLat, DEFAULT_ZOOM);

//                        var halfIcon = icon.clone();
//                        markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(0,45),halfIcon));
//
//                        var marker = new OpenLayers.Marker(new OpenLayers.LonLat(90,10),icon.clone());
//                        marker.setOpacity(0.2);
//                        marker.events.register('mousedown', marker, function(evt) { alert(this.icon.url); OpenLayers.Event.stop(evt); });
//                        markers.addMarker(marker);
//                        map.addControl(new OpenLayers.Control.LayerSwitcher());
                        //map.zoomToMaxExtent();

//                        halfIcon.setOpacity(0.5);
                }
            }
        }])
    .directive("mapquestMaps", ['TLV_COORDINATES', 'DEFAULT_ZOOM', 'FIND_ME_DEFAULT_ZOOM',
        function (TLV_COORDINATES, DEFAULT_ZOOM, FIND_ME_DEFAULT_ZOOM) {

            return {
                restrict: 'E',
                priority: 10,
                scope: {
                    findMe: '=',
                    markers: '=',
                    selected: '='
                },
                replace: true,
                template: '<div id="mapquestMapsWrapper" style="height: 600px;"></div>',
                link: function (scope, elem, attrs) {

                    /*Create an object for options*/
                    var mapOptions = {
                        elt: elem[0], /*ID of element on the page where you want the map added*/
                        zoom: DEFAULT_ZOOM, /*initial zoom level of map*/
                        latLng: {lat: TLV_COORDINATES.latitude, lng: TLV_COORDINATES.longitude}, /*center of map in latitude/longitude*/
                        mtype: 'osm'                                /*map type (osm)*/
                    };

                    /*Construct an instance of MQA.TileMap with the options object*/
                    window.map = new MQA.TileMap(mapOptions);

                    /*Using the MQA.Poi constructor*/
                    var info = new MQA.Poi({lat: TLV_COORDINATES.latitude, lng: TLV_COORDINATES.longitude});

                    /*Sets the rollover content of the POI.*/
                    info.setRolloverContent('Hello, your are here, TLV');

                    /*Sets the InfoWindow contents for the POI. By default when the POI receives a mouseclick
                     event, the InfoWindow will be displayed with the HTML passed in to MQA.POI.setInfoContentHTML method.*/
                    info.setInfoContentHTML('InfoWindow Content for Tel Aviv, TLV');

                    /*This will add the POI to the map in the map's default shape collection.*/
                    map.addShape(info);
                }
            }
        }]);

