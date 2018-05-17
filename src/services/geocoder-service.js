/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */

import { Observable } from 'rxjs';
import { LocationViewModel } from '../models/location';

/**
 *  GeocoderService wraps maps.google.Geocoder
 *  with rxjs observables. Provides LocationViewModels
 *
 */
export class GeocoderService {
    constructor(){
        this._googleGeocoder = new google.maps.Geocoder();
    }

    geocode(address){

        if(!this._googleGeocoder){
            throw Error('GeocoderService: Not ready for geocoding');
        }

        return new Observable(observer => {

            let cancelled = false;

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
                    observer.error(status);
                }

            });

            return () => {
                this.cancelled = true;
            };
        });
    }

    /**
     * Convert a geocode result to a LocationViewModel
     *
     * @param {any} result
     */
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