import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import { FoursquareService, FS_CATEGORY_BAR, FS_CATEGORY_BREWERY } from './foursquare-service';
import { PLACES_SEED } from './places-seed';
import { PlaceViewModel } from '../models/place';

export class PlacesService {
    constructor(){

        this._places$ = new BehaviorSubject([]);
        this.places = [];
        this._load();
        this._foursquare = new FoursquareService();
    }

    favorites(){
        return this._places$.asObservable();
    }

    has(id){
        return !!(this.find(id));
    }

    find(id){
        return this._places$.value.find(place => place.id === id);
    }

    add(place){
        this._places$.next([...this._places$.value, place]);
        this._save();
        place.isSaved(true);
    }

    remove(place){
        let places = this._places$.value.filter(saved => saved.id !== place.id);
        this._places$.next(places);
        this._save();
        place.isSaved(false);
    }

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

    _save(){

        console.log('save', this._places$.value);

        let ojects = this._places$.value.map(place => place.serialize());

        let value = JSON.stringify(ojects);
        localStorage.setItem('my_places', value);
    }

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