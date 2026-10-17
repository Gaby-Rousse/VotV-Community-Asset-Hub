import TypeEnum from "~/models/enums/TypeEnum";
import  ItemEnum from "~/models/enums/ItemEnum";


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
    item: ItemEnum["3D Model"],
    type: TypeEnum.All,
    search: "",
    searchBy: SearchBy.Name,
    tags: [],
    sort: SortBy.Alphabetical,
    reverse: false,
    page: 1,
    ownerId: "",
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
}