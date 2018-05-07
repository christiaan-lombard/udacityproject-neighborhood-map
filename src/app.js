import './scss/styles.scss';
import ko from 'knockout';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import 'rxjs/operators'
import { PLACES } from './locations/places'
import { MAP_STYLES } from './map/map-styles'

class MapService {

    constructor(){
        this.ready = new BehaviorSubject(false);
        this.results$ = new BehaviorSubject(null);
        this.address$ = new BehaviorSubject('Paarl');
        this.bounds$ = new BehaviorSubject('Paarl');
        this.markers = [];
        this._places = null;
        this._locationListener = ()=>{};
    }

    init(map){
        this.map = map;
        this._places = new google.maps.places.PlacesService(this.map);
    }

    setCenter(pos){
        this.map.setCenter(pos);
    }

    fitBounds(bounds){
        this.map.fitBounds(bounds);
    }

    setLocations(locations){
        this.markers.forEach(marker => marker.marker.setMap(null));
        this.markers = [];

        locations.forEach((loc, i) => {
            // console.log(loc.geo_location);
            // setTimeout(() => {
            this.markers.push(this._makeMarker(loc));
            // }, i * 100);
        });
    }

    setLocationClickListener(callback){
        this._locationListener = callback;
    }

    _makeMarker(location){
        let marker = new google.maps.Marker( {
            map: this.map,
            animation: google.maps.Animation.DROP,
            position: location.geo_location,
        });

        marker.addListener('click', (event) => {

            console.log(event);

            if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
            } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
            }
            this._locationListener(location);
        });

        return {
            marker,
            location
        };

    }

}

class GeocoderService {
    constructor(){
        this.ready$ = new BehaviorSubject(false);
        this.address$ = new BehaviorSubject(null);

        this.results$ =
            this.ready$
                .pipe(
                    filter(ready => ready),
                    switchMap(ready => this.address$),
                    debounceTime(1000),
                    filter(address => address && address.length > 1),
                    switchMap(address => {
                        return this._requestGeocode(address);
                    }),
                    catchError(err => {
                        console.error('GeocoderService: error %o', err);
                        return of([]);
                    })
                );
        this._geocoder = null;
    }

    init(){
        this._geocoder = new google.maps.Geocoder();
        this.ready$.next(true);
    }

    results(){
        return this.results$;
    }

    geocode(address){
        return this.address$.next(address);
    }

    geocoder(){
        return this.ready$.pipe(map(ready => this._geocoder));
    }

    _requestGeocode(address){
        return new Observable(observer => {
            observer.next([]);
            this._geocoder.geocode({address}, (results, status) => {
                if (status == 'OK') {
                    observer.next(results);
                }else{
                    console.error("GeocoderService: Error getting results", results, status);
                    observer.next([]);
                }
                observer.complete();
            });
        });
    }

}

class PlacesService {
    constructor(){
        this.ready$ = new BehaviorSubject(false);
        this.bounds$ = new BehaviorSubject(null);
        this._places = null;

        this.results$ =
            this.ready$
                .pipe(
                    filter(ready => ready),
                    switchMap(ready => this.bounds$),
                    debounceTime(1000),
                    filter(bounds => bounds !== null),
                    switchMap(bounds => {
                        return this._requestNearbySearch(bounds);
                    }),
                    catchError(err => {
                        console.error('PlacesService: error %o', err);
                        return of([]);
                    })
                );

    }

    init(map){
        this._places = new google.maps.places.PlacesService(map);
        this.ready$.next(true);
    }

    results(){
        return this.results$;
    }

    searchNearby(bounds){
        this.bounds$.next(bounds);
    }

    _requestNearbySearch(bounds){
        return new Observable(observer => {

            let request = {
                bounds,
                keyword: 'beer'
            };

            observer.next([]);

            this._places.nearbySearch(request, (results, status) => {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    observer.next(results);
                    observer.complete();
                }else{
                    observer.error(status);
                }
            });
        });
    }

}

class AppViewModel {
    constructor(map, geocoder, places){

        this._map = map;
        this._geocoder = geocoder;
        this._places = places;

        this.locations = ko.observableArray(PLACES);
        this.searchText = ko.observable("Paarl");
        this.searchResult = ko.observable("");
        this.filteredLocations = ko.observableArray(PLACES);

        this.searchText.subscribe((search) => {
            this.searchLocation(search);
        });

        this.searchLocation(this.searchText());

        this._geocoder.results().subscribe(results => {
            console.log('GEOCODE', results);
            if(results.length > 0){
                let primary = results[0];
                this.searchResult(primary.formatted_address);

                if(primary.geometry.bounds){
                    this._map.fitBounds(primary.geometry.bounds);
                    this._places.searchNearby(primary.geometry.bounds);
                }else{
                    this._map.setCenter(primary.geometry.location);
                }

            }
        });

        this._places.results().subscribe(results => {
            console.log('PLACES %o', results);

            if(results && results.length > 0){
                let locations = results.map(result => {

                    let photo = result.photos ? result.photos[0] : null;

                    return {
                        name: result.name,
                        photo_url: photo ? photo.getUrl({maxHeight: 356, maxWidth: 356}) : null,
                        vicinity: result.vicinity,
                        geo_location: {
                            lat: result.geometry.location.lat(),
                            lng: result.geometry.location.lng(),
                        },
                    };
                });
                this.locations(locations);
                this._map.setLocations(locations);
            }

        });

        this._map.setLocationClickListener(location => {
            console.log(location);
        });

    }

    geolocateUser(){
        console.log('AppViewModel: geolocate user');
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(position => {

                console.log('AppViewModel: user location %o', position);

                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                this._map.setCenter(pos);
                this.searchResult('My location');
            });
        }
    }

    searchLocation(search){
        // let results = this.locations();

        // if(search && search.length > 1){
        //     results = results.filter(loc => {
        //         return loc.title.toLowerCase().includes(search);
        //     });
        // }

        // this.filteredLocations(results);
        this._geocoder.geocode(search);
    }

}

let mapService = new MapService();
let geocoderService = new GeocoderService();
let placesService = new PlacesService();

window.initMap = function() {

    let map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 8,
        styles: MAP_STYLES
    });

    mapService.init(map);
    placesService.init(map);
    geocoderService.init();
};


ko.applyBindings(new AppViewModel(mapService, geocoderService, placesService));

