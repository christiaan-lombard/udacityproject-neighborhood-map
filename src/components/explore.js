import { BehaviorSubject } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import ko from 'knockout';

export const RECOMMENDED_PLACES = [
    {
        
    }
];


export class ExploreViewModel {
    constructor(mapService, geocoderService, placesService){

        this._mapService = mapService;
        this._geocoderService = geocoderService;
        this._placesService = placesService;
        this._filterText$ = new BehaviorSubject('');
        this._filterTextSub = null;

        this.filterText = ko.observable('');
        this.places = ko.observableArray([]);
        this.locations = ko.observableArray([]);
        this.error = ko.observable(null);
        this.isLocationsEmpty = ko.observable(false);
        this.focusedLocation = ko.observable(null);
        this.showLocations = ko.observable(false);
        this.showPlaces = ko.observableArray(false);

        this.focusLocation = (location) => {
            console.log('focus', location);

            this.focusedLocation(location);

            this._mapService.setCenter(location.geoLocation);
            this.searchPlaces(location.geoLocation);

            this.lastSearch = location.address;
            this.filterText(location.address);
            this.showLocations(false);
        };

        this.focusPlace = (place) => {

            this._placesService.getDetail(place)
                               .subscribe(detail => {
                                   this._mapService.showInfo(place, detail);
                               });
        };

        this.togglePlaces = () => {
            this.showPlaces(!this.showPlaces());
        };

        this.toggleButtonIcon = ko.computed(() => {
            return this.showPlaces() ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
        });

        this.toggleSave = (place) => {
            if(place.isSaved()){
                this._placesService.remove(place);
            }else{
                this._placesService.add(place);
            }
        };

        this.filterText.subscribe(value => {
            this._filterText$.next(value);
        });

    }

    searchLocations(text){
        this._geocoderService
            .geocode(text)
            .subscribe(
                locations => {
                    console.log('locations', locations);
                    this.isLocationsEmpty(locations.length === 0);
                    this.locations(locations);
                    this.showLocations(true);
                    this.error(null);
                },
                error => {
                    this.error('Oops! Error retreiving location results...');
                    this.locations([]);
                    this.showLocations(false);
                    this.isLocationsEmpty(false);
                }
            );
    }

    searchPlaces(geoLocation){
        this._placesService
            .searchNear(geoLocation)
            .subscribe(
                places => {
                    this.places(places);
                    this.showPlaces(true);
                    this.error(null);
                    this.updateMapMarkers();
                },
                err => {
                    this.places([]);
                    this.showPlaces(false);
                    this.error('Oops! Error retreiving places...');
                    this.updateMapMarkers();
                }
            );
    }

    focus(){
        this.updateMapMarkers();

        this._filterTextSub =
            this._filterText$
                .pipe(
                    debounceTime(500),
                    filter(text => {

                        let focused =
                            this.focusedLocation() ?
                                this.focusedLocation().address : null;

                        return text &&
                                text.length > 1 &&
                                text !== focused;
                    })
                )
                .subscribe(
                    text => {
                        this.searchLocations(text);
                    }
                );

    }

    blur(){
        if(this._filterTextSub){
            this._filterTextSub.unsubscribe();
            this._filterTextSub = null;
        }
    }

    updateMapMarkers(){
        let places = this.places();
        this._mapService.fitPlaces(places);
        this._mapService.clearMarkers();

        places.forEach(place => {
            let marker = this._mapService.placeMarker(place);
            marker.addListener('click', () => {
                this.focusPlace(place);
            });
        });
    }
}