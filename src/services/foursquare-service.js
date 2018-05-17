/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */

import { map } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';

export const FS_CATEGORY_BAR = '4bf58dd8d48988d116941735';
export const FS_CATEGORY_BREWERY = '50327c8591d4c4b30a586d5d';


/**
 * The FoursquareService requests venues from the Foursquare API
 */
export class FoursquareService {

    /**
     * "Returns a list of venues near the current location"
     * See https://developer.foursquare.com/docs/api/venues/search
     *
     * @param {LatLng} geoLocation
     * @param {Array[string]} categories
     */
    searchVenues(geoLocation, categories){

        let ll = [geoLocation.lat, geoLocation.lng].join(',');
        let intent = 'browse';
        let radius = 10000;
        let categoryId = categories.join(',');

        return this._request('venues/search', {ll, intent, radius, categoryId});
    }

    /**
     * "Gives the full details about a venue including location, tips, and categories."
     * See https://developer.foursquare.com/docs/api/venues/details
     *
     * @param {string} venueId
     */
    venueDetail(venueId){
        return this._request(`venues/${venueId}`);
    }

    /**
     * Build a base ajax request
     *
     * @param {string} urlSlug
     * @param {any} params
     */
    _request(urlSlug, params){

        let defaults = {
            client_id: "HETCXLL4DLMY1E0AYRIMRAC3J1YQBT4OVOIVSZVBWYCMKNVP",
            client_secret: "HYWDNHYSCC0MG1XQ3ZK1ATUM0Y2CN3DEPO5M2X50FNZP3SQY",
            v: "20180511",
        };

        let query = this._getQuery(Object.assign(defaults, params));

        return ajax(`https://api.foursquare.com/v2/${urlSlug}${query}`)
                    .pipe(
                        map(resource => {
                            console.log('FOURSQUARE RES', resource);

                            if(resource.status !== 200){
                                throw Error("Foursquare API error");
                            }

                            let result = resource.response.response;
                            return result;
                        })
                    );
    }

    /**
     * Convert object to query string
     * @param {any} obj
     */
    _getQuery(obj){
        return Object.keys(obj).reduce(function (str, key, i) {
            var delimiter, val;
            delimiter = (i === 0) ? '?' : '&';
            key = encodeURIComponent(key);
            val = encodeURIComponent(obj[key]);
            return [str, delimiter, key, '=', val].join('');
        }, '');
    }

}