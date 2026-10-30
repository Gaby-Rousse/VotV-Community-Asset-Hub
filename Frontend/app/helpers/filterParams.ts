import { defaultFilters, type Filters, SearchBy, SortBy } from "~/models/interfaces/Filters";
import TypeEnum from "~/models/enums/TypeEnum";
import ItemEnum from "~/models/enums/ItemEnum";
import type ContentRatingEnum from "~/models/enums/ContentRatingEnum";

export function filtersToParams(filters: Filters, defaults: Filters = defaultFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.item != null && filters.item !== defaults.item)
        params.set("item", String(filters.item));
    if (filters.type !== defaults.type)
        params.set("type", String(filters.type));
    if (filters.search)
        params.set("search", filters.search);
    if (filters.searchBy !== defaults.searchBy)
        params.set("searchBy", String(filters.searchBy));
    if (filters.tags.length > 0)
        params.set("tags", filters.tags.join(" "));
    if (filters.sort !== defaults.sort)
        params.set("sort", String(filters.sort));
    if (filters.reverse)
        params.set("reverse", "true");
    if (filters.page !== 1)
        params.set("page", String(filters.page));
    if (filters.ownerId)
        params.set("ownerId", filters.ownerId);
    const sameRatings = [...filters.ratings].sort((a, b) => a - b).join() === [...defaults.ratings].sort((a, b) => a - b).join();
    if (!sameRatings)
        filters.ratings.forEach(r => params.append("ratings", String(r)));
    return params;
}

export function paramsToFilters(params: URLSearchParams, defaults: Filters = defaultFilters): Filters {
    return {
        item:     (params.has("item") ? Number(params.get("item")) : defaults.item) as ItemEnum,
        type:     (params.has("type") ? Number(params.get("type")) : defaults.type) as TypeEnum,
        search:   params.get("search") ?? "",
        searchBy: (params.has("searchBy") ? Number(params.get("searchBy")) : defaults.searchBy) as SearchBy,
        tags:     params.get("tags")?.split(" ").filter(Boolean) ?? [],
        sort:     (params.has("sort") ? Number(params.get("sort")) : defaults.sort) as SortBy,
        reverse:  params.get("reverse") === "true",
        page:     parseInt(params.get("page") ?? "1") || 1,
        ownerId:  params.get("ownerId") ?? "",
        ratings: params.has("ratings")
            ? params.getAll("ratings").map(Number) as ContentRatingEnum[]
            : defaults.ratings,
    };
}