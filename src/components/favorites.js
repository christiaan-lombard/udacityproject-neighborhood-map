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
        this.isPlacesEmpty = ko.observable(false);
        this.isFilteredEmpty = ko.observable(false);

        this.places = ko.observableArray([]);

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

            this._placesService.getDetail(place)
                               .subscribe(detail => {
                                   this._mapService.showInfo(place, detail);
                               });

        };

        /**
         * Remove a place from favorites
         *
         * @param {PlaceViewModel} place
         */
        this.removePlace = (place) => {
            this._placesService.remove(place);
        };

        // pass filter text to the BehaviorSubject
        this.filterText.subscribe(text => {
            this._filterText$.next(text);
        });

    }

    /**
     * Focus this component
     *  - subscribes to change stream
     */
    focus(){

        let favorites$ = this._placesService.favorites();

        // combine stream list of favorites with filter text stream
        // to poulate the places list
        this._filterSub = combineLatest(this._filterText$, favorites$)
            .pipe(debounceTime(200))
            .subscribe(changes => {

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


}