import './scss/styles.scss';
import ko from 'knockout';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import 'rxjs/operators'


class MapService {

    constructor(){
        this.ready = new BehaviorSubject(false);
    }

    init(){
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -34.397, lng: 150.644},
            zoom: 8
        });
    }

    setCenter(){

    }

}

class GeocoderService {
    constructor(){
        this.ready$ = new BehaviorSubject(false);
        this.results$ = new BehaviorSubject(null);
        this.address$ = new BehaviorSubject('Paarl');
        this._geocoder = null;
    }

    init(){
        this._geocoder = new google.maps.Geocoder();
        this.ready$.next(true);

        combineLatest([this.geocoder(), this.address$])
            .subscribe(changes => {
                let [geocoder, address] = changes;
                if(geocoder && address){
                    geocoder.geocode({address}, (results, status) => {
                        if (status == 'OK') {
                            this.results$.next(results);
                        }else{
                            console.error("GeocoderService: Error getting results", results, status);
                        }
                    });
                }
            })
    }

    observe(){
        return this.results$.asObservable();
    }

    geocode(address){
        return this.address$.next(address);
    }

    geocoder(){
        return this.ready$.map(ready => this._geocoder);
    }

}

class AppViewModel {
    constructor(map, geocoder){
        this.locations = ko.observableArray([]);
        this.map = map;
        this.geocoder = geocoder;
    }
}

let mapService = new MapService();
let geocoderService = new GeocoderService();

window.initMap = function() {
    map.init();
    geocoder.init();
};


ko.applyBindings(new AppViewModel(mapService, geocoderService));

