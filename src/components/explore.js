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

            if(location.geoBounds){
                this._mapService.fitBounds(location.geoBounds);
            }else{
                this._mapService.setCenter(location.geoLocation);
                this._mapService.setZoom(12);
            }

            this.focusedLocation(location);
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
                               .subscribe(
                                    detail => {
                                        this._mapService.showInfo(place, detail);
                                        this.error(null);
                                    },
                                    error => {
                                        this._mapService.showError(place, 'Error retreiving venue details...');
                                        this.error('Error retreiving venue details...');
                                    }
                                );
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

        /**
         * Computed array of filtered places
         * based on filterText
         */
        this.filteredPlaces = ko.computed(() => {
            let filterText = this.filterText().toLowerCase();
            if(filterText && filterText.length > 1){
                return ko.utils.arrayFilter(this.places(), place => {
                                    let search = place.name.toLowerCase();
                                    return search.search(filterText) !== -1;
                                });
            }
            return this.places();
        }).extend({ throttle: 500 });

        // listen for filtered item changes
        // to update markers
        this.filteredPlaces.subscribe(filtered => {
            this.updateMapMarkers();
        });

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
        this.filterText('');

        // select a random location
        let location = this._getRandomLocation();
        this.selectLocation(location);
    }

    /**
     * Blur this component
     *  - unsubscribes from change stream
     */
    blur(){
        this._mapService.clearMarkers();
        this._mapService.closeInfo();
    }

    /**
     * Update the map markers with the current places
     */
    updateMapMarkers(){
        let places = this.filteredPlaces();
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