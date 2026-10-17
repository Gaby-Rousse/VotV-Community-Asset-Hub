import {useAuth} from "~/context/AuthContext";
import type Artist from "~/models/interfaces/Artist";
import {useEffect, useState} from "react";
import {DeleteArtist} from "~/components/artists/DeleteArtist";
import ShowArtist from "~/components/artists/ShowArtist";
import {useLoading} from "~/context/LoadingContext";
import {apiCall} from "~/components/Functions";
import {fetchArtist} from "~/api/artists";
import {useNavigate} from "react-router";
import {Page} from "~/models/enums/Page";
import {useFilters} from "~/context/FiltersContext";
import {SearchBy} from "~/models/interfaces/Filters";
import {defaultInfo, type Info} from "~/models/interfaces/Info";
import SimpleBar from "simplebar-react";

interface ArtistFilters {
    ownerId: string;
    search: string;
    page: number;
}

const defaultArtistFilters : ArtistFilters = {
    ownerId: "",
    search: "",
    page: 1,
}

export default function ListArtists({setSelectedArtist, setIsNavigating, setPage}: {
    setSelectedArtist: (artist: Artist | null) => void,
    setIsNavigating: (value: boolean) => void
    setPage: (page: Page) => void,
}) {
    const {isAuthenticated, id, isAdmin} = useAuth();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [artistId, setArtistId] = useState(0);
    const [deleteArtist, setDeleteArtist] = useState(false);
    const [trigger, setTrigger] = useState(0);
    const {isLoading, setIsLoading} = useLoading();
    const [query, setQuery] = useState("");
    const [owned, setIsOwned] = useState(false);
    const {filters, setFilters} = useFilters();
    const [artistFilters, setArtistFilters] = useState<ArtistFilters>(defaultArtistFilters);
    const [info, setInfo] = useState<Info>(defaultInfo);

    useEffect(() => {
        const delay = artistFilters.search !== "" ? 300 : 0;
        const timeout = setTimeout(() => {
            setIsLoading(true);
            const params = new URLSearchParams();
            Object.entries(artistFilters).forEach(([key, value]) => {
                params.append(key, value.toString());
            });
            const url = `/api/Artists?${params.toString()}`;
            apiCall(url, null).then(res => res.json())
                .then(response => {
                    setInfo({totalPages: response.totalPages, totalCount: response.totalCount});
                    setArtists(response.data)
                })
                .catch(err => console.error('Failed to fetch artists:', err)).finally(() => setIsLoading(false));
        },delay)
        
        return () => clearTimeout(timeout);
        
    }, [trigger, artistFilters]);

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
                <div className="flex flex-row w-full">
                <div className="flex flex-row items-center dos">
                    <button className="px-2"
                            onClick={() => setArtistFilters(prevState => ({
                                ...prevState,
                                page: Math.max(1, Math.min(prevState.page - 1, info.totalPages))
                            }))}>&lt;</button>
                    <div className="flex flex-row">
                        <div>{artistFilters.page}</div>
                        <div>/</div>
                        <div>{info.totalPages}</div>
                    </div>
                    <button className="px-2"
                            onClick={() => setArtistFilters(prevState => ({
                                ...prevState,
                                page: Math.max(1, Math.min(prevState.page + 1, info.totalPages))
                            }))}>&gt;</button>
                </div>
                <div className="flex w-full flex-row gap-1 mt-0.5 mx-0.5">
                    <input type="text" onChange={(e) => setArtistFilters(prevState => ({...prevState, search: e.target.value}))}
                           className="dos text-center border flex-1"
                           placeholder="Search..."/>
                    {isAuthenticated && (<button  onClick={() => setArtistFilters(prevState => ({...prevState, ownerId: prevState.ownerId === id ? "" : id}))}
                                                className={`dos border hover:cursor-pointer px-2 ${artistFilters.ownerId && ("selected")}`}>Owned
                    </button>)}
                </div>

                </div>
                <div className="flex mx-1 flex-row dos">
                    <div>Avatar</div>
                    <div className="ml-2">Name</div>
                    <div className="ml-auto mr-4">Assets</div>
                </div>
                <SimpleBar className="min-h-0 flex-1">
                    <div className="flex flex-col">
                    {artists.map((a) => (
                            <div onClick={() => setArtistId(a.id)} key={a.id}
                                 className="flex flex-row gap-1 hover:cursor-pointer border-b">
                                <img className="w-14 h-14 border-r shrink-0" src={a.pfpUrl} alt="Avatar"/>
                                <div className="flex flex-col gap-3 min-w-0">
                                    <div className="dos my-auto line-clamp-1">{a.name}</div>
                                </div>
                                <div className="flex flex-row gap-1 shrink-0 ml-auto mr-1 my-auto">
                                    {isAuthenticated && (<button onClick={(e) => {
                                        e.stopPropagation();
                                        fetchArtist(a.id, true).then(data => {
                                            setSelectedArtist(data);
                                            setIsNavigating(false);
                                        });
                                    }}
                                        className="dos  shrink-0  hover:cursor-pointer sm:pr-6 px-2 py-1 border-2 flex flex-row gap-2">
                                        <img className="size-6" src="https://votvbroadcast.com/images/pencil.png"/>
                                        <div className="hidden sm:flex">Edit</div>
                                    </button>)}
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

                                        </>) : ("")
                                    ) : ("")

                                    }
                                </div>

                                <div onClick={(e) => {e.stopPropagation(); setPage(Page.Asset); setFilters(prevState => ({...prevState, searchBy: SearchBy.Artist, search:a.name}))}} className="my-auto dos py-1 mr-3 min-w-15 text-center border-2 p-2">{a.assetCount}</div>
                            </div>
                        )
                    )}
                    </div>
                </SimpleBar>

            </div>
        </>
    )
}