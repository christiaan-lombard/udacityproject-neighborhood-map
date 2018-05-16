/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */

import { MAP_STYLES } from './map-styles'


 /**
  * The MapService interacts with a google.maps.Map instance
  *
  */
export class MapService {

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

    setCenter(pos){
        this.map.setCenter(pos);
    }

    fitBounds(bounds){
        this.map.fitBounds(bounds);
    }

    showInfo(place, details){
        console.log('info', place);
        this.infoWindow.setContent(`
            <h4>${place.name}</h4>
            <p>Address: ${place.address}</p>
            <p>${details.categories}</p>
            <p>Rating: ${details.rating}</p>
            <a href="${details.link}" target="_blank">MORE INFO</a>
        `);
        this.infoWindow.open(this.map, place.marker);
        this.setCenter(place.geoLocation);
    }

    closeInfo(){
        this.infoWindow.close();
    }

    fitPlaces(places){
        let bounds = new google.maps.LatLngBounds();
        places.forEach(place => {
            bounds.extend(place.geoLocation);
        });
        this.fitBounds(bounds);
    }

    placeMarker(place){
        let marker = new google.maps.Marker( {
            map: this.map,
            animation: google.maps.Animation.DROP,
            position: place.geoLocation,
            title: place.name
        });

        this.markers.push(marker);
        place.marker = marker;

        return marker;
    }

    clearMarkers(){
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
    }

}
