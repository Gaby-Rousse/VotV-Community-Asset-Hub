import type Asset from "~/models/interfaces/Asset";
import {apiCall} from "~/components/Functions";
import type Tag from "~/models/interfaces/Tag";
import type DetailedTag from "~/models/interfaces/DetailedTag";
import type ContentRatingEnum from "~/models/enums/ContentRatingEnum";

export async function fetchTag(id: number): Promise<Tag> {
    const response = await apiCall(`/api/Tags/${id}`, null);
    const data = await response.json();
    return data;
}

export function downloadCollection(id: number, ratings: ContentRatingEnum[]): void {
    const params = new URLSearchParams();
    ratings.forEach(r => params.append("ratings", String(r)));
    const a = document.createElement("a");
    a.href = `${import.meta.env.VITE_API_URL ?? ""}/api/Tags/${id}/download?${params}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}