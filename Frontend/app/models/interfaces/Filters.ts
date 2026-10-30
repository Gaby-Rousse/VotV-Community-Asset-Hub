import TypeEnum from "~/models/enums/TypeEnum";
import ItemEnum from "~/models/enums/ItemEnum";
import ContentRatingEnum from "~/models/enums/ContentRatingEnum";


export interface Filters {
    item: ItemEnum | null;
    type?: TypeEnum;
    search: string | null;
    searchBy: SearchBy;
    tags: string[];
    sort: SortBy;
    reverse: boolean;
    page: number;
    ownerId: string;
    ratings: ContentRatingEnum[]
}

export enum SearchBy {
    "Name",
    "Artist",
}

export enum SortBy {
    "Alphabetical",
    "Date",
    "Size",
    "Count",
}

export const defaultFilters: Filters = {
    item: ItemEnum.All,
    type: TypeEnum.All,
    search: "",
    searchBy: SearchBy.Name,
    tags: [],
    sort: SortBy.Date,
    reverse: false,
    page: 1,
    ownerId: "",
    ratings: [ContentRatingEnum.General]
}

export const defaultTagFilters: Filters = {
    item: null,
    type: TypeEnum.All,
    search: "",
    searchBy: SearchBy.Name,
    tags: [],
    sort: SortBy.Alphabetical,
    reverse: false,
    page: 1,
    ownerId: "",
    ratings: [ContentRatingEnum.General]
}