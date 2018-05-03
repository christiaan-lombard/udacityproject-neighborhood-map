import './scss/styles.scss';
import ko from 'knockout';

class AppViewModel {
    constructor(){
        this.locations = ko.observableArray([]);

    }
}


ko.applyBindings(new AppViewModel());