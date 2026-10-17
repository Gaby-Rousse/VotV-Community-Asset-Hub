import type Asset from "~/models/interfaces/Asset";
import {apiCall} from "~/components/Functions";
import type Tag from "~/models/interfaces/Tag";
import type DetailedTag from "~/models/interfaces/DetailedTag";

export async function fetchTag(id: number): Promise<Tag> {
    const response = await apiCall(`/api/Tags/${id}`, null);
    const data = await response.json();
    return data;
}

export async function fetchDetailedTag(id: number): Promise<DetailedTag> {
    const response = await apiCall(`/api/Tags/${id}?includeAssets=true`, null);
    const data = await response.json();
    return data;
}

export function downloadCollection(id: number): void {
    const a = document.createElement("a");
    a.href = `${import.meta.env.VITE_API_URL ?? ""}/api/Tags/${id}/download`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}