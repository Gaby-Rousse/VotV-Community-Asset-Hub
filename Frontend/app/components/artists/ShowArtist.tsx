import {useLoading} from "~/context/LoadingContext";
import React, {useEffect, useState} from "react";
import type Artist from "~/models/interfaces/Artist";
import {GenerateSocial} from "~/components/Functions";
import {fetchArtist} from "~/api/artists";

export default function ShowArtist({id, setId}: { id: number, setId: (value: number) => void }) {
    const [artist, setArtist] = useState<Artist | null>();
    useEffect(() => {
        setIsLoading(true)
        fetchArtist(id).then(data => setArtist(data)).finally(() => setIsLoading(false));
    }, [id]);

    const {setIsLoading} = useLoading();

    return (
        <>
            <div className="fixed flex flex-col w-full h-full top-0 left-0 right-0 bottom-0 bg-black/50 z-10 ">

                <div
                    className="flex flex-col mx-auto my-auto w-full h-full sm:w-2/3 sm:h-2/3 bg-black border-2 overflow-hidden">
                    <div className="flex shrink-0 w-full gap-2 h-28 border-b-2 flex-row">
                        <img className="border-r-2 w-28 h-full object-cover" alt="avatar" src={artist?.pfpUrl}/>
                        <div className="dos text-3xl line-clamp-1 my-auto">{artist?.name}</div>
                        <button onClick={() => setId(0)}
                                className="dos shrink-0 border hover:cursor-pointer size-8 ml-auto mb-auto m-1"
                                type="button">
                            <img src="https://votvbroadcast.com/images/cross.png"/>
                        </button>
                    </div>

                    <div className="flex flex-1 flex-col p-1 min-h-0">
                        <div className="flex flex-col min-h-0 flex-1 mb-4">
                            <div className="dos shrink-0">Description:</div>
                            <div className="dos overflow-y-auto">
                                {artist?.description}
                            </div>
                        </div>

                        <div className="flex flex-col min-h-0 flex-1">
                            <div className="dos shrink-0">Socials:</div>
                            <div className="flex-col flex overflow-y-auto">
                                {artist?.socials?.map((social) => {
                                    return <GenerateSocial url={social} key={social}/>
                                })}
                            </div>
                        </div>

                    </div>
                </div>


            </div>
        </>
    )
}
