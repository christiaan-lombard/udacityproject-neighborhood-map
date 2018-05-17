
/**
 * @author base1.christiaan@gmail.com (Christiaan Lombard)
 */

/**
 * The PlaceDetailViewModel represents additional
 * info for a given PlaceViewModel provided by
 * the PlacesService
 */
export class PlaceDetailViewModel {

    /**
     * Make a PlaceDetailViewModel instance
     * @param {string} link
     * @param {number} rating
     * @param {string} categories
     */
    constructor(link, rating, categories){
        this.link = link;
        this.rating = rating;
        this.categories = categories;
    }
}