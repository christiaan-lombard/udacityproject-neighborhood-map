import ko from 'knockout';

export class PlaceViewModel {
    constructor(id, name, address, geoLocation, isSaved){

        // this._placesSerice = placesService;

        this.id = id;
        this.name = name;
        this.address = address;
        this.geoLocation = geoLocation;
        this.isSaved = ko.observable(isSaved);
        this.marker = null;
    }

    serialize(){
        return {
            id: this.id,
            name: this.name,
            address: this.address,
            geoLocation: this.geoLocation
        };
    }

}
