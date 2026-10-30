import type Asset from "~/models/interfaces/Asset";
import {apiCall, ApiError} from "~/components/Functions";

export async function fetchAsset(id: number, seeChanges: boolean = false): Promise<Asset> {
    const response = await apiCall(`/api/Assets/${id}?seeChanges=${seeChanges}`, null);
    if (!response.ok) throw new ApiError(response.status);
    return response.json();
}