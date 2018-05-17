/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */

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
 *
 * The AppViewModel acts as a router for sub components
 *
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

        // init sub components
        this.favorites = new FavoritesViewModel(mapService, geocoderService, placesService);
        this.explore = new ExploreViewModel(mapService, geocoderService, placesService);

        // switching the mode selects which component
        // to show, 'explore' or 'favorite'
        this.mode = ko.observable('explore');

        // switch mode explore
        this.switchModeExplore = () => {
            console.log('switchModeExplore');
            this.mode('explore');
            this.favorites.blur();
            this.explore.focus();
        };

        // switch mode favorite
        this.switchModeFavorite = () => {
            console.log('switchModeFavorite');
            this.mode('favorite');
            this.explore.blur();
            this.favorites.focus();
        };

        // default mode
        this.switchModeExplore();
    }

}

/**
 *  Ready-callback function for Google Maps JS
 *
 *  Initializes the application and services and applies knockout bindings
 *
 */
window.initMap = function() {
    let mapService = new MapService();
    let geocoderService = new GeocoderService();
    let placesService = new PlacesService();
    let app = new AppViewModel(mapService, geocoderService, placesService);

    ko.applyBindings(app);
};



