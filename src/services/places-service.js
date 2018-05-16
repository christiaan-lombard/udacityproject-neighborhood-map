import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import { FoursquareService, FS_CATEGORY_BAR, FS_CATEGORY_BREWERY } from './foursquare-service';
import { PLACES_SEED } from './places-seed';
import { PlaceViewModel } from '../models/place';
import { PlaceDetailViewModel } from '../models/place-detail';

/**
 * The PlacesService provides locally stored places
 * and interacts with Foursquare to explore new places
 *
 *
 */
export class PlacesService {

    constructor(){
        /** @private @const {BehaviorSubject<PlaceViewModel[]>} */
        this._places$ = new BehaviorSubject([]);

        /** @private @const {FoursquareService} */
        this._foursquare = new FoursquareService();

        this._load();
    }

    /**
     * Get an Observable stream of locally stored places
     *
     *  - Emits changes when adding, removing places
     *  - Observer never completes
     *
     */
    favorites(){
        return this._places$.asObservable();
    }

    /**
     * Check if locally stored place exists
     *
     * @param {string} id
     * @returns {boolean}
     */
    has(id){
        return !!(this.find(id));
    }

    /**
     * Find a locally stored place by id or Foursquare venueId
     *
     * @param {string} id
     * @returns {PlaceViewModel | undefined}
     */
    find(id){
        return this._places$.value.find(place => place.id === id);
    }

    /**
     * Add a place to the locally stored places
     *
     * @param {PlaceViewModel} place
     */
    add(place){
        this._places$.next([...this._places$.value, place]);
        this._save();
        place.isSaved(true);
    }

    /**
     * Remove a place from the locally stored places
     *
     * @param {PlaceViewModel} place
     */
    remove(place){
        let places = this._places$.value.filter(saved => saved.id !== place.id);
        this._places$.next(places);
        this._save();
        place.isSaved(false);
    }

    /**
     * Requests the detail of the given place
     * from Foursquare
     *
     * @param {PlaceViewModel} place
     * @returns {Observable<PlaceDetailViewModel>}
     */
    getDetail(place){
        return this._foursquare
                    .venueDetail(place.id)
                    .pipe(
                        map(result => {

                            let categories =
                                result.venue
                                      .categories
                                      .map(cat => cat.name)
                                      .join(' | ');

                            return {
                                categories: categories,
                                link: result.venue.shortUrl,
                                rating: result.venue.rating,
                            };
                        })
                    );
    }

    /**
     * Search for places (Foursquare venues) near the given lat, lng
     *
     * @param {LatLng} geoLocation
     */
    searchNear(geoLocation){
        return this._foursquare
                    .searchVenues(geoLocation, [FS_CATEGORY_BAR, FS_CATEGORY_BREWERY])
                    .pipe(
                        map(result => {
                            let models = result.venues.map(venue => this._foursquareResultToPlace(venue));
                            return models;
                        })
                    );
    }

    /**
     * Commit the in-memory places array to localStorage
     *
     */
    _save(){

        console.log('save', this._places$.value);

        let ojects = this._places$.value.map(place => place.serialize());

        let value = JSON.stringify(ojects);
        localStorage.setItem('my_places', value);
    }

    /**
     * Load stored places from localStorage to memory,
     * or use the PLACES_SEED
     *
     */
    _load(){
        let places = [];
        let stored = localStorage.getItem('my_places');
        let parsed = JSON.parse(stored);
        if(Array.isArray(parsed)){
            places = parsed;
            console.info('PlacesService: loaded from storage');
        }else{
            places = PLACES_SEED;
            console.info('PlacesService: using seed');
        }
        this._places$.next(places.map(obj => this._objectToPlace(obj)));
    }

    /**
     * Map a serialized object to a PlaceViewModel
     *
     * @param {any} obj
     */
    _objectToPlace(obj){
        return new PlaceViewModel(
            // this,
            obj.id,
            obj.name,
            obj.address,
            obj.geoLocation,
            true
        );
    }

    /**
     * Map a Foursquare Venue result to a PlaceViewModel
     *
     * @param {any} obj
     */
    _foursquareResultToPlace(result){

        let isSaved =
            this._places$.value.findIndex(place => result.id === place.id) !== -1;

        return new PlaceViewModel(
            // this,
            result.id,
            result.name,
            result.location.formattedAddress.join(', '),
            {
                lat: result.location.lat,
                lng: result.location.lng,
            },
            isSaved
        );
    }


}