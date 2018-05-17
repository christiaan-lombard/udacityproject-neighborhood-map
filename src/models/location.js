/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */
import ko from 'knockout';

/**
 * The LocationViewModel represents a general location/address
 * provided by the GeocoderService
 */
export class LocationViewModel {
    constructor(placeId, address, geoBounds, geoLocation){
        this.placeId = placeId;
        this.geoBounds = geoBounds;
        this.address = address;
        this.geoLocation = geoLocation;
    }
}

