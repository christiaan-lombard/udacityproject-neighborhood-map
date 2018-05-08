import { BehaviorSubject, Observable, combineLatest, of, Subject } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

export class PlacesService {
    constructor(){
        this.ready$ = new BehaviorSubject(false);
        this.bounds$ = new BehaviorSubject(null);
        this._places = null;

        this.results$ =
            this.ready$
                .pipe(
                    filter(ready => ready),
                    switchMap(ready => this.bounds$),
                    debounceTime(1000),
                    filter(bounds => bounds !== null),
                    switchMap(bounds => {
                        return this._requestNearbySearch(bounds);
                    }),
                    // catchError(err => {
                    //     console.error('PlacesService: error %o', err);
                    //     return of([]);
                    // })
                );

    }

    init(map){
        this._places = new google.maps.places.PlacesService(map);
        this.ready$.next(true);
    }

    results(){
        return this.results$;
    }

    searchNearby(bounds){
        this.bounds$.next(bounds);
    }

    _requestNearbySearch(bounds){
        return new Observable(observer => {

            let request = {
                bounds,
                keyword: 'beer'
            };

            this._places.nearbySearch(request, (results, status) => {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    observer.next(results);
                    observer.complete();
                }else{
                    observer.error(status);
                }
            });
        });
    }

}