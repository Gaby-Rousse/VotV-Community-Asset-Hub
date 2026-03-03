import {useEffect, useState, useMemo, useRef} from "react";
import { useAuth } from "~/context/AuthContext";
import type Asset from "~/models/interfaces/Asset";
import {useLoading} from "~/context/LoadingContext";
import {apiCall, humanDate, selectAspectRatio} from "~/components/Functions";
import AssetDetailModal from "~/components/assets/AssetDetailModal";
import {useSearchParams} from "react-router";

export default function ListAssets({item, setIsNavigating, setSelectedAsset, pictureType}: {
    item: number,
    setIsNavigating: (item: boolean) => void,
    setSelectedAsset: (value: Asset) => void,
    pictureType: number | null
}) {
    let [searchParams, setSearchParams] = useSearchParams();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [assetId, setAssetId] = useState(parseInt(searchParams.get("assetId") ?? "0"));
    const [trigger, setTrigger] = useState(0);
    const [query, setQuery] = useState("");
    const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
    const [selectedFilter, setSelectedFilter] = useState(0);
    const {isLoading, setIsLoading} = useLoading();
    const [owned, setIsOwned] = useState(false);
    const {isAuthenticated, id, isAdmin} = useAuth()
    const [menuOpened, setMenuOpened] = useState(false);
    const [timeTaken, setTimeTaken] = useState(0.0);
    //0 thumbnail, 1 list, 2 posts
    const [display, setDisplay] = useState(0);
    const [sort, setSort] = useState("Alphabetically")
    const [reverseSort, setReverseSort] = useState(false)
    const [tagQuery, setTagQuery] = useState("")
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function updateAssetId(assetId : number) {
        if(assetId == 0)
            setSearchParams({});
        else
            setSearchParams({ assetId: assetId.toString() });
        setAssetId(assetId);
    }

    useEffect(() => {
        let start = performance.now()
        setIsLoading(true);
        apiCall("/api/Assets?item=" + item, null).then(res => res.json())
            .then(data => {
                setAssets(data);
                setTimeTaken(performance.now() - start);
            })
            .catch(err => console.error('Failed to fetch assets:', err)).finally(() => setIsLoading(false));
    }, [item, trigger]);

    const tagCounts = useMemo(() => {
        const map = new Map<string, number>();
        assets.forEach(asset => {
            (asset.tags ?? []).forEach((tag: string) => {
                map.set(tag, (map.get(tag) ?? 0) + 1);
            });
        });
        return map;
    }, [assets]);

    function handleTagInput(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setTagQuery(value);

        const lastWord = value.split(" ").pop() ?? "";
        if (lastWord.length >= 1) {
            const matches = [...tagCounts.entries()]
                .filter(([tag]) => tag.toLowerCase().startsWith(lastWord.toLowerCase()))
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([tag]) => tag);
            setTagSuggestions(matches);
            setShowSuggestions(matches.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }

    function selectSuggestion(tag: string) {
        const parts = tagQuery.split(" ");
        parts[parts.length - 1] = tag + " ";
        setTagQuery(parts.join(" "));
        setShowSuggestions(false);
        inputRef.current?.focus();
    }

    useEffect(() => {
        let filtered = assets
        if (selectedFilter == 0) {
            filtered = assets.filter(asset =>
                asset.name.toLowerCase().includes(query.toLowerCase()));
        } else if (selectedFilter == 1) {
            filtered = assets.filter(asset =>
                // @ts-ignore
                asset.artistName.toLowerCase().includes(query.toLowerCase())
            );
        }
        if (owned) {
            filtered = filtered.filter(asset => asset.ownerId === id);
        }
        if (pictureType != null) {
            filtered = filtered.filter(asset => asset.type === pictureType);
        }
        if (tagQuery.trim()) {
            filtered = filtered.filter(asset =>
                // @ts-ignore
                asset.tags != null && tagQuery.trim().split(/\s+/).every(tag => asset.tags.includes(tag))
            )
        }
        if (sort == "Alphabetically") {
            filtered = filtered.sort((a, b) => a.name.localeCompare(b.name))
        }
        if (sort == "Creation") {
            filtered = filtered.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        }
        if (reverseSort) {
            filtered = filtered.reverse()
        }
        setFilteredAssets(filtered);
    }, [query, assets, selectedFilter, owned, pictureType, tagQuery, sort, reverseSort]);


    return (
        <>
            {assetId != 0 ? (<AssetDetailModal id={assetId} setId={updateAssetId} setSelectedAsset={setSelectedAsset}
                                               setIsNavigating={setIsNavigating} setTrigger={setTrigger}/>) : ("")}

            <div className="flex max-w-full w-full min-w-0 flex-row gap-1 mt-1 mx-0.5">
                <input type="text" onChange={(e) => setQuery(e.target.value)} className="dos text-center border w-full"
                       placeholder="Search..."/>
                <button onClick={() => setSelectedFilter(0)}
                        className={`dos border md:whitespace-nowrap hover:cursor-pointer px-2 ${selectedFilter == 0 ? ("selected") : ("")}`}>By
                    Title
                </button>
                <button onClick={() => setSelectedFilter(1)}
                        className={`dos border md:whitespace-nowrap hover:cursor-pointer px-2 ${selectedFilter == 1 ? ("selected") : ("")}`}>By
                    Artist
                </button>
                {isAuthenticated ? (<button onClick={() => setIsOwned(!owned)}
                                            className={`dos mr-1 border hover:cursor-pointer px-2 ${owned ? ("selected") : ("")}`}>Owned
                </button>) : ("")}
            </div>
            <div className="flex justify-center items-center overflow-y-auto mt-3 mb-8.5 sm:mt-1 px-1 gap-3 flex-wrap flex-row ">
                {
                    display == 0 ? (filteredAssets.map((a) => (
                        <div onClick={() => updateAssetId(a.id)} className="flex hover:cursor-pointer flex-col" key={a.id}>
                            <div className={`mx-auto ${selectAspectRatio({item: a.item, type: a.type})} border relative`}>
                                <img loading="lazy" className="absolute object-contain mx-auto w-full h-full"
                                     alt="thumbnail" src={a.thumbnailUrl ?? ""}/>
                                <div className="absolute px-1 top-0 h-10 w-full flex items-center flex-col bg-black/50">
                                    <div className="dos line-clamp-1 my-auto text-center">{a.name}</div>
                                </div>
                                <div className="absolute px-1 bottom-0 h-20 w-full flex flex-col bg-black/50">
                                    <div className="dos truncate">By: {a.artistName} </div>
                                    <div className="dos">Size: {a.size ?? "N/A"}</div>
                                    <div className="dos text-center mt-auto">{humanDate(a.createdAt ?? "")}</div>
                                </div>
                            </div>
                        </div>
                    ))) : (
                        <>
                            <div className="flex dos w-full gap-4">
                                <div className="w-16 shrink-0">Thumbnail</div>
                                <div className="flex-1">Title</div>
                                <div className="w-30 md:w-40 lg:w-60 shrink-0">Artist</div>
                                <div className="hidden md:flex w-25 shrink-0">Created</div>
                            </div>
                            {filteredAssets.map((a) => (
                                <div onClick={() => updateAssetId(a.id)}
                                     className="flex w-full items-center url dos gap-4 hover:cursor-pointer"
                                     key={a.id}>
                                    <img loading="lazy" className="size-8 shrink-0 object-contain" src={a.thumbnailUrl}/>
                                    <div className="flex-1 min-w-0 truncate">{a.name}</div>
                                    <div className="w-30 md:w-40 lg:w-60 shrink-0 truncate">{a.artistName}</div>
                                    <div className="hidden md:flex w-25 shrink-0">{humanDate(a.createdAt ?? "")}</div>
                                </div>
                            ))}
                        </>
                    )
                }
            </div>

            <div className={`dos border absolute z-10 transition-all bg-black left-0 ${menuOpened ? ("h-60") : ("h-8")} bottom-0 flex flex-col w-full`}>
                <div onClick={() => setMenuOpened(!menuOpened)}
                     className="flex flex-row h-8 w-full px-6 hover:cursor-pointer border-b items-center">
                    <div className="dos">{menuOpened ? ("▼") : ("▲")}</div>
                    <div className="mx-auto dos">Menu</div>
                    <div className="dos">{menuOpened ? ("▼") : ("▲")}</div>
                </div>
                {menuOpened && (<div className="p-2 flex gap-1 flex-col">
                    <div>Time taken to fetch assets: {timeTaken} ms</div>
                    <div>Assets found: {filteredAssets.length}</div>
                    <div className="flex flex-row items-center gap-1">
                        <div>Display:</div>
                        <button onClick={() => setDisplay(display)}
                                className={`border opacity-50 ${display == 2 && ("selected")} w-28 p-1`}>Posts
                        </button>
                        <button onClick={() => setDisplay(0)}
                                className={`border ${display == 0 && ("selected")} w-28 p-1`}>Thumbnails
                        </button>
                        <button onClick={() => setDisplay(1)}
                                className={`border ${display == 1 && ("selected")} w-28 p-1`}>List
                        </button>
                    </div>
                    <div className="flex gap-1 mt-1 flex-row">
                        <div className="text-nowrap">Tags filter:</div>
                        <div className="relative w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                value={tagQuery}
                                onChange={handleTagInput}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                className="dos text-center border w-full"
                                placeholder="Tags (separated by spaces)"/>
                            {showSuggestions && (
                                <div className="absolute z-20 left-0 right-0 border border-white bg-black bottom-full mb-0.5">
                                    {tagSuggestions.map(tag => (
                                        <div
                                            key={tag}
                                            onMouseDown={() => selectSuggestion(tag)}
                                            className="dos px-2 url py-0.5 hover:cursor-pointer flex justify-between">
                                            <span className=" w-full">{tag}</span>
                                            <span className="opacity-50">{tagCounts.get(tag)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-row mt-1 items-center gap-1">
                        <div>Order by:</div>
                        <button onClick={() => setSort("Alphabetically")}
                                className={`border ${sort == "Alphabetically" && ("selected")} w-36 p-1`}>Alphabetically
                        </button>
                        <button onClick={() => setSort("Creation")}
                                className={`border ${sort == "Creation" && ("selected")} w-36 p-1`}>Date
                        </button>
                        <button onClick={() => setReverseSort(!reverseSort)}
                                className={`border ml-5 ${reverseSort && ("selected")} w-36 p-1`}>Reverse
                        </button>
                    </div>
                </div>)}
            </div>
        </>
    );
}