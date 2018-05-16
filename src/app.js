import './scss/styles.scss';
import ko from 'knockout';
import { BehaviorSubject, Observable, combineLatest, of, Subject } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { MAP_STYLES } from './map-styles'

import { GeocoderService } from './services/geocoder-service';
import { PlacesService } from './services/places-service';
import { MapService } from './services/map-service';

import { LocationViewModel } from './models/location';
import { PlaceViewModel } from './models/place';


class ExploreViewModel {
    constructor(mapService, geocoderService, placesService){

        this._mapService = mapService;
        this._geocoderService = geocoderService;
        this._placesService = placesService;
        this._filterText$ = new BehaviorSubject('');
        this._filterTextSub = null;

        this.filterText = ko.observable('');
        this.places = ko.observableArray([]);
        this.locations = ko.observableArray([]);
        this.error = ko.observable(null);
        this.isLocationsEmpty = ko.observable(false);
        this.focusedLocation = ko.observable(null);
        this.showLocations = ko.observable(false);
        this.showPlaces = ko.observableArray(false);

        this.focusLocation = (location) => {
            console.log('focus', location);

            this.focusedLocation(location);

            this._mapService.setCenter(location.geoLocation);
            this.searchPlaces(location.geoLocation);

            this.lastSearch = location.address;
            this.filterText(location.address);
            this.showLocations(false);
        };

        this.focusPlace = (place) => {

            this._placesService.getDetail(place)
                               .subscribe(detail => {
                                   this._mapService.showInfo(place, detail);
                               });
        };

        this.togglePlaces = () => {
            this.showPlaces(!this.showPlaces());
        };

        this.toggleButtonIcon = ko.computed(() => {
            return this.showPlaces() ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
        });

        this.toggleSave = (place) => {
            if(place.isSaved()){
                this._placesService.remove(place);
            }else{
                this._placesService.add(place);
            }
        };

        this.filterText.subscribe(value => {
            this._filterText$.next(value);
        });

    }

    init(){


    }

    searchLocations(text){
        this._geocoderService
            .geocode(text)
            .subscribe(
                locations => {
                    console.log('locations', locations);
                    this.isLocationsEmpty(locations.length === 0);
                    this.locations(locations);
                    this.showLocations(true);
                    this.error(null);
                },
                error => {
                    this.error('Oops! Error retreiving location results...');
                    this.locations([]);
                    this.showLocations(false);
                    this.isLocationsEmpty(false);
                }
            );
    }

    searchPlaces(geoLocation){
        this._placesService
            .searchNear(geoLocation)
            .subscribe(
                places => {
                    this.places(places);
                    this.showPlaces(true);
                    this.error(null);
                    this.updateMapMarkers();
                },
                err => {
                    this.places([]);
                    this.showPlaces(false);
                    this.error('Oops! Error retreiving places...');
                    this.updateMapMarkers();
                }
            );
    }

    focus(){
        this.updateMapMarkers();

        // if(!this.focusedLocation()){
        //     this.focusedLocation({

        //     });
        // }

        this._filterTextSub =
            this._filterText$
                .pipe(
                    debounceTime(500),
                    filter(text => {

                        let focused =
                            this.focusedLocation() ?
                                this.focusedLocation().address : null;

                        return text &&
                                text.length > 1 &&
                                text !== focused;
                    })
                )
                .subscribe(
                    text => {
                        this.searchLocations(text);
                    }
                );

    }

    blur(){
        if(this._filterTextSub){
            this._filterTextSub.unsubscribe();
            this._filterTextSub = null;
        }
    }

    updateMapMarkers(){
        let places = this.places();
        this._mapService.fitPlaces(places);
        this._mapService.clearMarkers();

        places.forEach(place => {
            let marker = this._mapService.placeMarker(place);
            marker.addListener('click', () => {
                this.focusPlace(place);
            });
        });
    }
}

class FavoritesViewModel {
    constructor(mapService, geocoderService, placesService){
        this._mapService = mapService;
        this._geocoderService = geocoderService;
        this._placesService = placesService;

        this._filterText$ = new BehaviorSubject('');
        this._filterSub = null;

        this.filterText = ko.observable('');
        this.showPlaces = ko.observable(true);
        this.isPlacesEmpty = ko.observable(false);
        this.isFilteredEmpty = ko.observable(false);

        this.places = ko.observableArray([]);

        this.toggleButtonIcon = ko.computed(() => {
            return this.showPlaces() ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
        });

        this.togglePlaces = () => {
            this.showPlaces(!this.showPlaces());
        };

        this.focusPlace = (place) => {

            this._placesService.getDetail(place)
                               .subscribe(detail => {
                                   this._mapService.showInfo(place, detail);
                               });

        };

        this.removePlace = (place) => {
            this._placesService.remove(place);
        };

        this.filterText.subscribe(text => {
            this._filterText$.next(text);
        });

    }

    init(){

    }

    focus(){

        let favorites$ = this._placesService.favorites();

        this._filterSub = combineLatest(this._filterText$, favorites$)
            .pipe(debounceTime(200))
            .subscribe(changes => {

                console.log('filter favorites', changes);

                let [filterText, favorites] = changes;

                if(favorites.length > 0){
                    this.isPlacesEmpty(false);
                }else{
                    this.isPlacesEmpty(true);
                }

                if(filterText && filterText.length > 1){
                    favorites = favorites
                                    .filter(place => {
                                        let target = filterText.toLowerCase();
                                        let search = place.name.toLowerCase();
                                        return search.search(target) !== -1;
                                    });
                    this.isFilteredEmpty(favorites.length === 0);
                }else{
                    this.isFilteredEmpty(false);
                }

                this.places(favorites);
                this.showPlaces(true);
                this.updateMapMarkers();
            });
    }

    blur(){
        if(this._filterSub){
            this._filterSub.unsubscribe();
        }
        this._mapService.clearMarkers();
        this._mapService.closeInfo();
    }

    applyFilter(){

    }

    updateMapMarkers(){
        let places = this.places();
        this._mapService.fitPlaces(places);
        this._mapService.clearMarkers();

        places.forEach(place => {
            let marker = this._mapService.placeMarker(place);
            marker.addListener('click', () => {
                this.focusPlace(place);
            });
        });
    }


}


class AppViewModel {
    constructor(mapService, geocoderService, placesService){

        this._mapService = mapService;
        this._geocoderService = geocoderService;
        this._placesService = placesService;

        this.favorites = new FavoritesViewModel(mapService, geocoderService, placesService);
        this.explore = new ExploreViewModel(mapService, geocoderService, placesService);

        this.mode = ko.observable('explore');

        this.switchModeExplore = () => {
            console.log('switchModeExplore');
            this.mode('explore');
            this.favorites.blur();
            this.explore.focus();
        };

        this.switchModeFavorite = () => {
            console.log('switchModeFavorite');
            this.mode('favorite');
            this.explore.blur();
            this.favorites.focus();
        };

    }

    init(){
        this.favorites.init();
        this.explore.init();
        this.switchModeExplore();
    }

    _resultToPlaceModel(result){
        let photo = result.photos ? result.photos[0] : null;

        let geoLocation = {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
        };

        let marker = this._mapService.addMarker(geoLocation, result.name);

        let place = new PlaceViewModel(
            result.place_id,
            result.name,
            photo ? photo.getUrl({maxHeight: 356, maxWidth: 356}) : null,
            result.vicinity,
            geoLocation,
            marker
        );

        marker.addListener('click', () => {
            this.focusPlace(place);
        });

        return place;

    }



}

let mapService = new MapService();
let geocoderService = new GeocoderService();
let placesService = new PlacesService();
let app = new AppViewModel(mapService, geocoderService, placesService);

window.initMap = function() {

    let map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 8,
        disableDefaultUI: true,
        styles: MAP_STYLES
    });

    mapService.init(map);
    // placesService.init(map);
    geocoderService.init();
    app.init();
};


ko.applyBindings(app);

