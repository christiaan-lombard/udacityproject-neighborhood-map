/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */


import { BehaviorSubject } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import ko from 'knockout';
import { RECOMMENDED_LOCATIONS } from '../services/locations-seed';

/**
 * The ExploreViewModel binds to .section-explore
 *
 * - Text input is geocoded to find a general location
 * - Selecting a location initiates a search for venues near the location
 *
 */
export class ExploreViewModel {

    /**
     * Make an ExploreViewModel instance
     *
     * @param {MapService} mapService
     * @param {GeocoderService} geocoderService
     * @param {PlacesService} placesService
     */
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

        /**
         * Focus on a location
         *  - centers the map on the location
         *  - initiates a search for places/venues
         *
         * @param {LocationViewModel} location
         */
        this.selectLocation = (location) => {
            console.log('focus', location);

            if(location.geoBounds){
                this._mapService.fitBounds(location.geoBounds);
            }else{
                this._mapService.setCenter(location.geoLocation);
                this._mapService.setZoom(12);
            }

            this.focusedLocation(location);
            this.filterText(location.address);
            this.showLocations(false);
            this.searchPlaces(location.geoLocation);
        };

        /**
         * Focus on a place
         * - requests the place details
         * - displays details on map
         *
         * @param {PlaceViewModel} place
         */
        this.selectPlace = (place) => {

            this._mapService.setCenter(place.geoLocation);
            this._mapService.setZoom(18);

            this._placesService.getDetail(place)
                               .subscribe(detail => {
                                   this._mapService.showInfo(place, detail);
                               });
        };

        /**
         * Toggle show/hide places
         */
        this.togglePlaces = () => {
            this.showPlaces(!this.showPlaces());
        };

        /**
         * The computed button icon
         */
        this.toggleButtonIcon = ko.computed(() => {
            return this.showPlaces() ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
        });

        /**
         * Add/remove a place from favorites
         * @param {PlaceViewModel} place
         */
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

    /**
     * Search locations matching the given address
     *
     * @param {string} text
     */
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

    /**
     * Search for places near the given geolocation
     *
     * @param {LatLng} geoLocation
     */
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

    /**
     * Focus this component
     *  - subscribes to change stream
     */
    focus(){
        this.updateMapMarkers();

        // subscribe to filter input changes,
        // debounce input, initiate search
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

        // select a random location if not currently selected
        if(!this.focusedLocation()){
            let location = this._getRandomLocation();
            this.selectLocation(location);
        }

    }

    /**
     * Blur this component
     *  - unsubscribes from change stream
     */
    blur(){
        if(this._filterTextSub){
            this._filterTextSub.unsubscribe();
            this._filterTextSub = null;
        }
    }

    /**
     * Update the map markers with the current places
     */
    updateMapMarkers(){
        let places = this.places();
        this._mapService.fitPlaces(places);
        this._mapService.clearMarkers();

        places.forEach(place => {
            let marker = this._mapService.placeMarker(place);
            marker.addListener('click', () => {
                this.selectPlace(place);
            });
        });
    }

    /**
     * Get a random location
     *
     * @private
     */
    _getRandomLocation(){
        return RECOMMENDED_LOCATIONS[Math.floor(Math.random() * RECOMMENDED_LOCATIONS.length)];
    }
}