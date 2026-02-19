import {fetchArtist} from "~/api/artists";
import {useEffect, useState} from "react";
import type Artist from "~/models/interfaces/Artist";
import {useLoading} from "~/context/LoadingContext";
import {apiCall} from "~/components/Functions";

export function DeleteArtist({id, setId, setDeleteArtist, setTrigger}: {
    id: number,
    setId: (value: number) => void,
    setDeleteArtist: (value: boolean) => void,
    setTrigger: (value: number) => void
}) {
    const {isLoading, setIsLoading} = useLoading();
    const [artist, setArtist] = useState<Artist | null>();
    useEffect(() => {
        setIsLoading(true);
        fetchArtist(id).then(data => setArtist(data)).finally(() => setIsLoading(false));
    }, [id]);

    async function sendDelete(id: number) {
        let response = await apiCall(`/api/Artists/${id}`, new FormData(), "DELETE");
        if (response.ok) {
            setDeleteArtist(false)
            setId(0)
            setTrigger(Date.now());
        } else {
            alert("idk man")
        }
    }


    return (
        <>
            <div className="fixed flex flex-col w-full h-full top-0 left-0 right-0 bottom-0 bg-black/50 z-10 ">
                <div className="flex flex-col mx-auto p-3 my-auto w-full h-full sm:w-1/3 sm:h-1/3 bg-black border-2">
                    <div className="text-center text-2xl dos">Are you sure you want to
                        delete <br/>
                        <div className="line-clamp-1">{artist?.name}</div>
                        ?
                    </div>
                    <div className="dos red text-center mt-auto mb-auto text-xl">If you delete this artist, all artworks
                        tagged with this artist will be tagged as "Server"
                    </div>
                    <div className="flex w-full justify-between mt-auto flex-row">
                        <button onClick={() => {
                            setDeleteArtist(false);
                            setId(0)
                        }} className="dos url hover:cursor-pointer border py-2 px-5 text-2xl">
                            Cancel
                        </button>
                        <button onClick={async () => await sendDelete(id)}
                                className="dos hover:cursor-pointer url border py-2 px-5 text-2xl">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}