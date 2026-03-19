import { defaultFilters, type Filters, SearchBy, SortBy } from "~/models/interfaces/Filters";
import TypeEnum from "~/models/enums/TypeEnum";
import ItemEnum from "~/models/enums/ItemEnum";

export function filtersToParams(filters: Filters): URLSearchParams {
    const params = new URLSearchParams();
    params.set("item", String(filters.item));
    if (filters.type !== defaultFilters.type)         
        params.set("type", String(filters.type));
    if (filters.search)                               
        params.set("search", filters.search);
    if (filters.searchBy !== defaultFilters.searchBy) 
        params.set("searchBy", String(filters.searchBy));
    if (filters.tags.length > 0)                      
        params.set("tags", filters.tags.join(" "));
    if (filters.sort !== defaultFilters.sort)         
        params.set("sort", String(filters.sort));
    if (filters.reverse)
        params.set("reverse", filters.reverse ? "true" : "false");
    if (filters.page !== 1)                           
        params.set("page", String(filters.page));
    if (filters.ownerId)                              
        params.set("ownerId", filters.ownerId);
    return params;
}

export function paramsToFilters(params: URLSearchParams): Filters {
    return {
        item:     (parseInt(params.get("item")     ?? "") || defaultFilters.item) as ItemEnum,
        type:     (parseInt(params.get("type")     ?? "") || defaultFilters.type) as TypeEnum,
        search:   params.get("search")   ?? "",
        searchBy: (parseInt(params.get("searchBy") ?? "") || defaultFilters.searchBy) as SearchBy,
        tags:     params.get("tags") ? params.get("tags")!.split(" ").filter(Boolean) : [],
        sort:     (parseInt(params.get("sort")     ?? "") || defaultFilters.sort) as SortBy,
        reverse:  params.get("reverse") === "true",
        page:     parseInt(params.get("page") ?? "1") || 1,
        ownerId:  params.get("ownerId") ?? "",
    };
}