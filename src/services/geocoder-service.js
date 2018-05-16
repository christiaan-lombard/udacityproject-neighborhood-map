import { Observable } from 'rxjs';
import { LocationViewModel } from '../models/location';
/**
 *  GeocoderService wraps maps.google.Geocoder
 *  with rxjs observables. Geocode requests are
 *  debounced and filtered to prevent 'too frequent' or
 *  invalid requests.
 *
 *   - The result stream will start once init() is called
 *   - Post geocode requests to `geocode(address)`
 *   - Listen for results by subscribing to `results()`
 *   - Listen for errors by subscribing to `errors()`
 *
 *
 *
 */
export class GeocoderService {
    constructor(){
        this._googleGeocoder = null;
    }

    init(){
        this._googleGeocoder = new google.maps.Geocoder();
    }

    geocode(address){

        if(!this._googleGeocoder){
            throw Error('GeocoderService: Not ready for geocoding');
        }

        return new Observable(observer => {

            let cancelled = false;

            console.debug("GeocoderService: geocode %s", address);

            this._googleGeocoder.geocode({address}, (results, status) => {

                if(cancelled) return;

                if (status == 'OK') {
                    let models = results.map(result => this._resultToLocationModel(result));
                    observer.next(models);
                    observer.complete();
                }else if(status === 'ZERO_RESULTS'){
                    observer.next([]);
                    observer.complete();
                }else{
                    console.error("GeocoderService: Error getting results", results, status);
                    observer.error(status);
                }

            });

            return () => {
                this.cancelled = true;
            };
        });
    }

    _resultToLocationModel(result){
        return new LocationViewModel(
            result.place_id,
            result.formatted_address,
            result.geometry.bounds,
            {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
            }
        );
    }



}