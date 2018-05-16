import ko from 'knockout';

export class LocationViewModel {
    constructor(placeId, address, geoBounds, geoLocation, marker){
        this.placeId = placeId;
        this.geoBounds = geoBounds;
        this.address = address;
        this.geoLocation = geoLocation;
        this.marker = marker;
    }
}
