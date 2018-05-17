/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */

import { MAP_STYLES } from './map-styles'


 /**
  * The MapService interacts with a google.maps.Map instance
  *
  */
export class MapService {

    /**
     * Make a MapService instance
     */
    constructor(){
        this.markers = [];
        this.infoWindow = null;
        this._locationListener = ()=>{};

        this.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -34.397, lng: 150.644},
            zoom: 8,
            disableDefaultUI: true,
            styles: MAP_STYLES
        });
        this.infoWindow = new google.maps.InfoWindow({});
    }

    /**
     * Center the map on location
     *
     * @param {LatLng} pos
     */
    setCenter(pos){
        this.map.setCenter(pos);
    }

    /**
     * Map viewport fit boundary
     *
     * @param {LatLngBounds} bounds
     */
    fitBounds(bounds){
        this.map.fitBounds(bounds);
    }

    /**
     * Set map zoom level
     *
     * @param {number} level
     */
    setZoom(level){
        this.map.setZoom(level);
    }

    /**
     * Show an info window at the given place
     * presenting the given details
     *
     * @param {PlaceViewModel} place
     * @param {PlaceDetailViewModel} details
     */
    showInfo(place, details){
        this.infoWindow.setContent(`
            <div class="place-info-window">
                <h4 class="name">${place.name}</h4>
                <p class="address">${place.address}</p>
                <p class="categories">${details.categories}</p>
                <a class="link"href="${details.link}" target="_blank">MORE INFO</a>
            </div>
        `);

        place.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            place.marker.setAnimation(null);
        }, 800);

        this.infoWindow.open(this.map, place.marker);
        this.setCenter(place.geoLocation);
    }

    /**
     * Close the info window
     */
    closeInfo(){
        this.infoWindow.close();
    }

    /**
     * Fit the given array of places into the map viewport
     *
     * @param {PlaceViewModel[]} places
     */
    fitPlaces(places){
        let bounds = new google.maps.LatLngBounds();
        places.forEach(place => {
            bounds.extend(place.geoLocation);
        });
        this.fitBounds(bounds);
    }

    /**
     * Create a marker at the given place
     *
     * @param {PlaceViewModel} place
     */
    placeMarker(place){
        let marker = new google.maps.Marker( {
            map: this.map,
            // animation: google.maps.Animation.DROP,
            position: place.geoLocation,
            title: place.name
        });

        this.markers.push(marker);
        place.marker = marker;

        return marker;
    }

    /**
     * Remove all the markers from the map
     */
    clearMarkers(){
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
    }

}
