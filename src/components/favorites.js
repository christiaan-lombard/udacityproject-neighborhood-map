import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import ko from 'knockout';


export class FavoritesViewModel {
    constructor(mapService, geocoderService, placesService){
        this._mapService = mapService;
        this._geocoderService = geocoderService;
        this._placesService = placesService;

        this._filterText$ = new BehaviorSubject('');
        this._filterSub = null;

        this.filterText = ko.observable('');
        this.showPlaces = ko.observable(true);
        this.isPlacesEmpty = ko.observable(false);
        this.isFilteredEmpty = ko.observable(false);

        this.places = ko.observableArray([]);

        this.toggleButtonIcon = ko.computed(() => {
            return this.showPlaces() ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
        });

        this.togglePlaces = () => {
            this.showPlaces(!this.showPlaces());
        };

        this.focusPlace = (place) => {

            this._placesService.getDetail(place)
                               .subscribe(detail => {
                                   this._mapService.showInfo(place, detail);
                               });

        };

        this.removePlace = (place) => {
            this._placesService.remove(place);
        };

        this.filterText.subscribe(text => {
            this._filterText$.next(text);
        });

    }

    focus(){

        let favorites$ = this._placesService.favorites();

        this._filterSub = combineLatest(this._filterText$, favorites$)
            .pipe(debounceTime(200))
            .subscribe(changes => {

                console.log('filter favorites', changes);

                let [filterText, favorites] = changes;

                if(favorites.length > 0){
                    this.isPlacesEmpty(false);
                }else{
                    this.isPlacesEmpty(true);
                }

                if(filterText && filterText.length > 1){
                    favorites = favorites
                                    .filter(place => {
                                        let target = filterText.toLowerCase();
                                        let search = place.name.toLowerCase();
                                        return search.search(target) !== -1;
                                    });
                    this.isFilteredEmpty(favorites.length === 0);
                }else{
                    this.isFilteredEmpty(false);
                }

                this.places(favorites);
                this.showPlaces(true);
                this.updateMapMarkers();
            });
    }

    blur(){
        if(this._filterSub){
            this._filterSub.unsubscribe();
        }
        this._mapService.clearMarkers();
        this._mapService.closeInfo();
    }

    applyFilter(){

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