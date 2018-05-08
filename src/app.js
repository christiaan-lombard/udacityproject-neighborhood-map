import './scss/styles.scss';
import ko from 'knockout';
import { BehaviorSubject, Observable, combineLatest, of, Subject } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { MAP_STYLES } from './map-styles'

import { GeocoderService } from './geocoder-service';
import { PlacesService } from './places-service';
import { MapService } from './map-service';


class PlaceViewModel {
    constructor(placeId, name, photoUrl, vicinity, geoLocation){
        this.placeId = placeId;
        this.name = name;
        this.photoUrl = photoUrl;
        this.vicinity = vicinity;
        this.geoLocation = geoLocation;
        this.isFocused = ko.observable(false);
    }
}

class LocationViewModel {
    constructor(placeId, address, geoBounds, geoLocation, marker){
        this.placeId = placeId;
        this.geoBounds = geoBounds;
        this.address = address;
        this.geoLocation = geoLocation;
        this.marker = marker;
    }
}


class AppViewModel {
    constructor(map, geocoder, places){

        this._map = map;
        this._geocoder = geocoder;
        this._places = places;

        this.locations = ko.observableArray([]);
        this.focusedLocation = ko.observable(null);
        this.showLocations = ko.observable(false);
        this.places = ko.observableArray([]);
        this.showPlaces = ko.observableArray(false);
        this.lastSearch = '';
        this.searchText = ko.observable('Paarl');

        this.searchText.subscribe((search) => {
            console.log('search', search);
            this.searchLocation(search);
        });

        this._geocoder.results().subscribe(results => {
            console.log('geocode results', results);
            if(results.length > 0){

                let models = results.map(result => {
                    return new LocationViewModel(
                        result.place_id,
                        result.formatted_address,
                        result.geometry.bounds,
                        result.geometry.location
                    );
                });

                this.locations(models);
                console.log('LOCATIONS', models);
                this.showLocations(true);
            }else{
                console.log('LOCATIONS empty');
            }
        });

        this._places.results().subscribe(results => {

            if(results && results.length > 0){
                this._map.removeMarkers();

                let places = results.map(result => {

                    let photo = result.photos ? result.photos[0] : null;

                    let geoLocation = {
                        lat: result.geometry.location.lat(),
                        lng: result.geometry.location.lng(),
                    };

                    let marker = this._map.addMarker(geoLocation);

                    return new PlaceViewModel(
                        result.place_id,
                        result.name,
                        photo ? photo.getUrl({maxHeight: 356, maxWidth: 356}) : null,
                        result.vicinity,
                        geoLocation,
                        marker
                    );
                });
                console.log('PLACES', places);
                this.places(places);
                this.showPlaces(true);
            }

        });

        this.focusLocation = (location) => {
            console.log('focus', location);
            if(location.geoBounds){
                this._map.fitBounds(location.geoBounds);
                this._places.searchNearby(location.geoBounds);
            }else{
                this._map.setCenter(location.geoLocation);
            }
            this.lastSearch = location.address;
            this.searchText(location.address);
            this.showLocations(false);
        };

        this.focusPlace = (place) => {
            console.log(place);
        };

        this.togglePlaces = () => {
            this.showPlaces(!this.showPlaces());
        };

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
        if(this.lastSearch !== search){
            this.lastSearch = search;
            this._geocoder.geocode(search);
        }
    }

}

let mapService = new MapService();
let geocoderService = new GeocoderService();
let placesService = new PlacesService();

window.initMap = function() {

    let map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 8,
        disableDefaultUI: true,
        styles: MAP_STYLES
    });

    mapService.init(map);
    placesService.init(map);
    geocoderService.init();
};


ko.applyBindings(new AppViewModel(mapService, geocoderService, placesService));

