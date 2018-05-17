/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */

import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import ko from 'knockout';

/**
 * The FavoritesViewModel binds to .section-favorites
 *
 * - Text input is used to filter stored places
 * - Places can be selected, removed
 *
 */
export class FavoritesViewModel {

    /**
     * Make a FavoritesViewModel instance
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
        this._filterSub = null;

        this.filterText = ko.observable('');
        this.showPlaces = ko.observable(true);

        this.places = ko.observableArray([]);
        this.error = ko.observable(null);

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
         * Focus on a place
         * - requests the place details
         * - displays details on map
         *
         * @param {PlaceViewModel} place
         */
        this.selectPlace = (place) => {

            this._mapService.setCenter(place.geoLocation);
            this._mapService.setZoom(18);

            this._placesService
                .getDetail(place)
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
         * Remove a place from favorites
         *
         * @param {PlaceViewModel} place
         */
        this.removePlace = (place) => {
            this._placesService.remove(place);
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
     * Focus this component
     *  - subscribes to change stream
     */
    focus(){

        // pass stream of favorite
        // places to knockout observable
        this._filterSub =
            this._placesService
                .favorites()
                .subscribe(favorites => {
                    this.places(favorites);
                });
    }

    /**
     * Blur this component
     *  - unsubscribes from change stream
     */
    blur(){
        if(this._filterSub){
            this._filterSub.unsubscribe();
        }
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


}