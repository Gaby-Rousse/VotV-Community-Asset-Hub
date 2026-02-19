import { useAuth } from "~/context/AuthContext";
import type Artist from "~/models/interfaces/Artist";
import {useEffect, useState} from "react";
import {DeleteArtist} from "~/components/artists/DeleteArtist";
import ShowArtist from "~/components/artists/ShowArtist";
import {useLoading} from "~/context/LoadingContext";
import {apiCall} from "~/components/Functions";
import {fetchArtist} from "~/api/artists";

export default function ListArtists({setSelectedArtist, setIsNavigating}: {
    setSelectedArtist: (artist: Artist | null) => void,
    setIsNavigating: (value: boolean) => void
}) {
    const {isAuthenticated, id, isAdmin} = useAuth();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [artistId, setArtistId] = useState(0);
    const [deleteArtist, setDeleteArtist] = useState(false);
    const [trigger, setTrigger] = useState(0);
    const {isLoading, setIsLoading} = useLoading();
    const [query, setQuery] = useState("");
    const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
    const [owned, setIsOwned] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        apiCall("/api/Artists", null).then(res => res.json())
            .then(data => setArtists(data))
            .catch(err => console.error('Failed to fetch artists:', err)).finally(() => setIsLoading(false));
    }, [trigger]);

    useEffect(() => {
        let filtered = artists.filter(artist =>
            artist.name.toLowerCase().includes(query.toLowerCase())
        );

        if (owned) {
            filtered = filtered.filter(artist => artist.ownerId === id);
        }

        setFilteredArtists(filtered);
    }, [query, artists, owned]);

    return (
        <>
            {artistId != 0 && (deleteArtist ? (
                <DeleteArtist id={artistId} setId={setArtistId} setDeleteArtist={setDeleteArtist}
                              setTrigger={setTrigger}/>) : (
                <ShowArtist id={artistId} setId={setArtistId}/>))}
            <div className="flex flex-col min-h-0">
                <div className="dos w-full purple text-center border-b">Click on an artist to see their socials and
                    a
                    description about them
                </div>
                <div className="flex flex-row gap-1 mt-0.5 mx-0.5">
                    <input type="text" onChange={(e) => setQuery(e.target.value)} className="dos text-center border flex-1"
                           placeholder="Search..."/>
                    {isAuthenticated ? (   <button onClick={() => setIsOwned(!owned)}
                                                   className={`dos border hover:cursor-pointer px-2 ${owned ? ("selected") : ("")}`}>Owned
                    </button>) : ("")}

                </div>
                <div className="overflow-y-auto min-h-0 flex flex-col">
                    {filteredArtists.map((a) => (
                            <div onClick={() => setArtistId(a.id)} key={a.id}
                                 className="flex flex-row gap-1 hover:cursor-pointer border-b">
                                <img className="w-12 h-12 border-r" src={a.pfpUrl} alt="Avatar"/>
                                <div className="flex flex-col gap-3">
                                    <div className="dos my-auto line-clamp-1">{a.name}</div>
                                </div>
                                <div className="flex flex-row gap-1 shrink-0 ml-auto mr-1 my-auto">
                                    {isAuthenticated ? (isAdmin || id == a.ownerId ? (<>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setArtistId(a.id);
                                                    setDeleteArtist(true);
                                                }}
                                                className="dos shrink-0 hover:cursor-pointer sm:pr-6 px-2 py-1 border-2 flex flex-row gap-2">
                                                <img className="size-6" src="https://votvbroadcast.com/images/trash.png"/>
                                                <div className="hidden sm:flex">Delete</div>
                                            </button>
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                fetchArtist(a.id).then(data => setSelectedArtist(data));
                                                setIsNavigating(false);
                                            }}
                                                    className="dos  shrink-0  hover:cursor-pointer sm:pr-6 px-2 py-1 border-2 flex flex-row gap-2">
                                                <img className="size-6" src="https://votvbroadcast.com/images/pencil.png"/>
                                                <div className="hidden sm:flex">Edit</div>
                                            </button>
                                        </>) : ("")
                                    ) : ("")

                                    }
                                    <button
                                        className="dos hidden hover:cursor-pointer sm:pr-6 px-2 py-1 border-2 flex flex-row gap-2">
                                        <img className="size-6" src="https://votvbroadcast.com/images/eye.png"/>
                                        <div className="hidden sm:flex">See assets from them</div>
                                    </button>
                                </div>


                            </div>
                        )
                    )}
                </div>

            </div>
        </>
    )
}