import type Asset from "~/models/interfaces/Asset";
import {apiCall} from "~/components/Functions";

export async function fetchAsset(id: number): Promise<Asset> {
    const response = await apiCall(`/api/Assets/${id}`, null);
    const data = await response.json();
    return data;
}