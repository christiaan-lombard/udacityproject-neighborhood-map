import { BehaviorSubject, Observable, combineLatest, of, Subject } from 'rxjs';
import { map, debounceTime, filter, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

export class GeocoderService {
    constructor(){
        this.ready$ = new BehaviorSubject(false);
        this.address$ = new BehaviorSubject(null);
        this.errors$ = new Subject();

        this.results$ =
            this.ready$
                .pipe(
                    filter(ready => ready),
                    switchMap(ready => this.address$),
                    debounceTime(1000),
                    filter(address => address && address.length > 1),
                    switchMap(address => {
                        return this._requestGeocode(address);
                    }),
                    // catchError(err => {
                    //     console.error('GeocoderService: error %o', err);
                    //     this.errors$.next(err);
                    //     return of([]);
                    // })
                );
        this._geocoder = null;
    }

    init(){
        this._geocoder = new google.maps.Geocoder();
        this.ready$.next(true);
    }

    results(){
        return this.results$;
    }

    errors(){
        return this.errors$.asObservable();
    }

    geocode(address){
        return this.address$.next(address);
    }

    geocoder(){
        return this.ready$.pipe(map(ready => this._geocoder));
    }

    _requestGeocode(address){
        return new Observable(observer => {

            console.debug("GeocoderService: geocode %s", address);

            this._geocoder.geocode({address}, (results, status) => {
                if (status == 'OK') {
                    observer.next(results);
                }else{
                    console.error("GeocoderService: Error getting results", results, status);
                    observer.next([]);
                }
                observer.complete();
            });
        });
    }

}