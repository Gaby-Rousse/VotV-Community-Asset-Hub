import {apiCall} from "~/components/Functions";
import type Artist from "~/models/interfaces/Artist";

export async function fetchArtist(id: number): Promise<Artist> {
    const response = await apiCall(`/api/Artists/${id}`, null);
    const data = await response.json();
    return data;
}