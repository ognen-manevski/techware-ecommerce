//category obj
export class Category {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        //if subcategories exist, create new Category instances for them
        this.subcategories = data.subcategories
            ? data.subcategories.map(sub => new Category(sub))
            : [];
    }
}