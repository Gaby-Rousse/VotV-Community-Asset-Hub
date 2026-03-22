import {useAuth} from "~/context/AuthContext";
import type Artist from "~/models/interfaces/Artist";
import type Asset from "~/models/interfaces/Asset";
import {apiCall} from "~/components/Functions";
import {useLoading} from "~/context/LoadingContext";
import {useState} from "react";

export default function AdvancedFields({asset, setNavigating} : {asset:Artist | Asset | null, setNavigating: (value:boolean) => void}) {
    const {id, isAdmin} = useAuth();
    const {setIsLoading} = useLoading();
    const [newUsername, setNewUsername] = useState<string>("");
    return (
        asset && (   <div className="flex flex-col mt-1 shrink m-w-0 w-full dos gap-1">
            <div className="mt-1">Advanced</div>
            <hr className="text-white" />
            {(id == asset?.ownerId || isAdmin) && (   <div className="flex flex-row gap-1">
                <div>Transfer ownership:</div>
                <input onChange={(e) => setNewUsername(e.target.value)} value={newUsername} className="border pl-2" type="text" placeholder="Username"/>
                <button onClick={() => transferOwnership(asset,setIsLoading,setNavigating,newUsername)} className="border px-2">GO!</button>
            </div>)}

            <div className="flex flex-row gap-1">
                <div>Delete your proposals:</div>
                <button onClick={() => DeleteProposals(asset.id,setIsLoading,setNavigating)} className="border px-2">GO!</button>
            </div>

        </div>)
    )
}

async function DeleteProposals(id:number, setIsLoading: (value:boolean) => void, setNavigating: (value:boolean) => void) {
    setIsLoading(true);
    await apiCall(`/api/edits/target/${id}`,new FormData, "DELETE").then((data) => {setIsLoading(false);}).then(() => setNavigating(true));
}

async function transferOwnership(asset: Asset|Artist, setIsLoading: (value:boolean) => void, setNavigating: (value:boolean) => void, username:string) {
    const isAsset = (obj: Artist | Asset): obj is Asset => 'filename' in obj;
    const formData = new FormData();
    formData.set("username", username);
    
    setIsLoading(true);
    await apiCall(`/api/${isAsset(asset) ? 'assets' : 'artists'}/${asset.id}/transfer`, formData, "POST");
    setIsLoading(false);
    setNavigating(true);
}