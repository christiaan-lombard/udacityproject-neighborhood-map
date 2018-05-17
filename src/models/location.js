import ko from 'knockout';

export class LocationViewModel {
    constructor(placeId, address, geoBounds, geoLocation){
        this.placeId = placeId;
        this.geoBounds = geoBounds;
        this.address = address;
        this.geoLocation = geoLocation;
    }
}

