


export class MapService {

    constructor(){
        this.markers = [];
        this.infoWindow = null;
        this.map = null;
        this._locationListener = ()=>{};
    }

    init(map){
        this.map = map;
        this.infoWindow = new google.maps.InfoWindow({
            content: 'Test'
        });
    }

    setCenter(pos){
        this.map.setCenter(pos);
    }

    fitBounds(bounds){
        this.map.fitBounds(bounds);
    }

    showInfo(content, marker){

    }

    addMarker(geoLocation){
        let marker = new google.maps.Marker( {
            map: this.map,
            animation: google.maps.Animation.DROP,
            position: geoLocation,
        });

        this.markers.push(marker);

        return marker;
    }

    removeMarkers(){
        this.markers.forEach(marker => marker.setMap(null));
    }

}
