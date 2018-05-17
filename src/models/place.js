/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */

import ko from 'knockout';

/**
 * The PlaceDetailViewModel represents a specific
 * venue/place provided by the PlacesService
 *
 */
export class PlaceViewModel {

    /**
     * Make a PlaceViewModel instance
     * @param {string} id
     * @param {string} name
     * @param {string} address
     * @param {LatLng} geoLocation
     * @param {boolean} isSaved
     */
    constructor(id, name, address, geoLocation, isSaved){
        this.id = id;
        this.name = name;
        this.address = address;
        this.geoLocation = geoLocation;
        this.isSaved = ko.observable(isSaved);
        this.marker = null;
    }

    /**
     * Convert to object for JSONification
     */
    serialize(){
        return {
            id: this.id,
            name: this.name,
            address: this.address,
            geoLocation: this.geoLocation
        };
    }

}
