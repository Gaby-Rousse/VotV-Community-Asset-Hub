import type Asset from "~/models/interfaces/Asset";
import {apiCall} from "~/components/Functions";

export async function fetchAsset(id: number, seeChanges: boolean = false): Promise<Asset> {
    const response = await apiCall(`/api/Assets/${id}?seeChanges=${seeChanges}`, null);
    const data = await response.json();
    return data;
}