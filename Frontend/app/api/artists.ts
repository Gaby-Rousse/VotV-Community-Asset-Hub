import {apiCall} from "~/components/Functions";
import type Artist from "~/models/interfaces/Artist";

export async function fetchArtist(id: number, seeChanges: boolean = false): Promise<Artist> {
    const response = await apiCall(`/api/Artists/${id}?seeChanges=${seeChanges}`, null);
    const data = await response.json();
    return data;
}