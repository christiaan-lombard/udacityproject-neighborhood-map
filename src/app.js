import './scss/styles.scss';
import ko from 'knockout';
import { BehaviorSubject, Observable, combineLatest, of, Subject } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';


import { GeocoderService } from './services/geocoder-service';
import { PlacesService } from './services/places-service';
import { MapService } from './services/map-service';

import { LocationViewModel } from './models/location';
import { PlaceViewModel } from './models/place';

import { ExploreViewModel } from './components/explore';
import { FavoritesViewModel } from './components/favorites';

/**
 * One model to control them all and the darkness bind them
 *
 */
class AppViewModel {

    /**
     * Create an instance of AppViewModel
     *
     * @param {MapService} mapService
     * @param {GeocoderService} geocoderService
     * @param {PlacesService} placesService
     */
    constructor(mapService, geocoderService, placesService){

        this._mapService = mapService;
        this._geocoderService = geocoderService;
        this._placesService = placesService;

        this.favorites = new FavoritesViewModel(mapService, geocoderService, placesService);
        this.explore = new ExploreViewModel(mapService, geocoderService, placesService);

        this.mode = ko.observable('explore');

        /**
         * 
         */
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


window.initMap = function() {
    let mapService = new MapService();
    let geocoderService = new GeocoderService();
    let placesService = new PlacesService();
    let app = new AppViewModel(mapService, geocoderService, placesService);

    ko.applyBindings(app);
};



