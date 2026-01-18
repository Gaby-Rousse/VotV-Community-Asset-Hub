import React, {Suspense, useEffect, useState} from "react";
import {Link} from "react-router";
import {useAuth} from '~/context/AuthContext';
import {apiCall, downloadFile, GenerateSocial} from "~/tsx/functions";
import type Artist from "~/models/interfaces/Artist";
import {ArtistDropdown, ArtistForm, FetchArtist, FetchArtists} from "~/tsx/artists";
import type Asset from "~/models/interfaces/Asset";
import ItemEnum from "~/models/enums/ItemEnum";
import {Canvas} from '@react-three/fiber';
import {OrbitControls, useGLTF} from '@react-three/drei';
import {LoadingProvider, useLoading} from "~/context/LoadingContext";


export async function clientLoader() {
    return {};
}

export async function loader() {
    return null;
}

//https://www.convex.dev/typescript/core-concepts/data-structures/typescript-dictionary
interface DictionaryType {
    [key: string]: number;
}

const labelDictionary: DictionaryType = {
    "3D Models": ItemEnum["3D Model"],
    "ATV Skins": ItemEnum["ATV Skin"],
    "Flags": ItemEnum["Flag"],
    "Pictures": ItemEnum["Picture"],
    "Posters": ItemEnum["Poster"],
    "Rugs": ItemEnum["Rug"],
    "Stickers": ItemEnum["Sticker"],
}

export default function Assets() {
    const [selectedButton, setSelectedButton] = useState("3D Models");
    const [isNavigating, setIsNavigating] = useState(true);
    const {isAuthenticated, id, isAdmin} = useAuth();
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
    const toggleNavigating = () => {
        setSelectedArtist(null);
        setSelectedAsset(null);
        setIsNavigating(!isNavigating);
    };
    const {isLoading, setIsLoading} = useLoading();

    return (
        <>
            <div className="md:border-3 border-solid h-screen bg-black flex flex-col p-0.5">
                <Nav isAuthenticated={isAuthenticated} isNavigating={isNavigating} toggleNavigating={toggleNavigating}
                     selectedButton={selectedButton}
                     setSelectedButton={setSelectedButton}></Nav>
                {
                    selectedButton === "Radio" || selectedButton === "TV" ? (
                        <VCBAdvertisement isNavigating={isNavigating}/>) : isNavigating ? (
                        selectedButton === "Artists" ? (
                            <FetchArtists setSelectedArtist={setSelectedArtist} setIsNavigating={setIsNavigating}/>
                        ) : (
                            <FetchAssets
                                item={labelDictionary[selectedButton]}
                                setIsNavigating={setIsNavigating}
                                setSelectedAsset={setSelectedAsset}
                            />
                        )
                    ) : selectedButton === "Artists" ? (
                        <ArtistForm
                            key={selectedArtist?.id ?? "new-artist"}
                            setIsNavigating={setIsNavigating}
                            setSelectedArtist={setSelectedArtist}
                            artist={selectedArtist}
                        />
                    ) : (
                        <AssetForm
                            key={selectedAsset?.id ?? "new-asset"}
                            item={labelDictionary[selectedButton]}
                            asset={selectedAsset}
                            setIsNavigating={setIsNavigating}
                        />
                    )
                }
            </div>
        </>
    )
}


export function Nav({selectedButton, setSelectedButton, toggleNavigating, isNavigating, isAuthenticated}: {
    selectedButton: string,
    setSelectedButton: (selectedButton: string) => void
    toggleNavigating: () => void
    isNavigating: boolean
    isAuthenticated: boolean
}) {
    return (
        <>
            <div className=" flex flex-row gap-1 border-solid border-3 md:m-0.5">
                <div className="px-1 overflow-x-auto flex flex-row gap-1 flex-nowrap w-full">
                    <Link
                        className="computerButton hover:cursor-pointer border-2 border-solid p-0.5 mt-1 mb-1 shrink-0 flex"
                        to="/"><img className="size-6" alt="home"
                                    src="https://votvbroadcast.com/images/home.png"/></Link>
                    <ComputerButton text="3D Models" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="ATV Skins" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Flags" selectedButton={selectedButton} setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Pictures" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Posters" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Rugs" selectedButton={selectedButton} setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Stickers" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="Radio" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>
                    <ComputerButton text="TV" selectedButton={selectedButton}
                                    setSelectedButton={setSelectedButton}/>

                    <div className="flex flex-row ml-auto shrink-0">
                        {isAuthenticated ? (<button
                            onClick={() => toggleNavigating()}
                            className={`computerButton shrink-0 border-2 w-28 border-solid p-0.5 mt-1 mb-1 mr-1 pl-4 pr-4 hover:cursor-pointer ${isNavigating ? '' : 'selected'} `}>
                            Upload
                        </button>) : ('')}
                        <ComputerButton text="Artists" selectedButton={selectedButton}
                                        setSelectedButton={setSelectedButton}/>
                    </div>
                </div>
            </div>
        </>
    )
}

export function ComputerButton({text, selectedButton, setSelectedButton}: {
    text: string,
    selectedButton: string,
    setSelectedButton: (value: string) => void
}) {
    return (
        <button
            onClick={() => setSelectedButton(text)}
            className={`w-28 shrink-0 computerButton hover:cursor-pointer border-2 border-solid p-0.5 mt-1 mb-1 pl-4 pr-4 ${selectedButton === text ? 'selected' : ''}`}>
            {text}
        </button>
    )
}

//https://dev.to/elfrontend/how-to-fetch-data-in-react-5-methods-compared-55nf
//apiCall c'est un fetch fancy
function FetchAssets({item, setIsNavigating, setSelectedAsset}: {
    item: number,
    setIsNavigating: (item: boolean) => void,
    setSelectedAsset: (value: Asset) => void,
}) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [assetId, setAssetId] = useState(0);
    const [trigger, setTrigger] = useState(0);
    const [query, setQuery] = useState("");
    const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
    const [selectedFilter, setSelectedFilter] = useState(0);
    const {isLoading, setIsLoading} = useLoading();


    useEffect(() => {
        setIsLoading(true);
        apiCall("http://10.0.0.131:5130/api/Assets?item=" + item, null).then(res => res.json())
            .then(data => setAssets(data))
            .catch(err => console.error('Failed to fetch assets:', err)).finally(() => setIsLoading(false));
    }, [item, trigger]);

    useEffect(() => {
        if (selectedFilter == 0) {
            setFilteredAssets(assets.filter(asset =>
                asset.name.toLowerCase().includes(query.toLowerCase())
            ));
        } else if (selectedFilter == 1) {
            setFilteredAssets(assets.filter(asset =>
                // @ts-ignore
                asset.artistName.toLowerCase().includes(query.toLowerCase())
            ));
        }

    }, [query, assets]);


    return (
        <>
            {assetId != 0 ? (<ShowAsset id={assetId} setId={setAssetId} setSelectedAsset={setSelectedAsset}
                                        setIsNavigating={setIsNavigating} setTrigger={setTrigger}/>) : ("")}
            <div className="flex flex-row gap-1 mt-1 mx-0.5">
                <input type="text" onChange={(e) => setQuery(e.target.value)} className="dos text-center border flex-1"
                       placeholder="Search..."/>
                <button onClick={() => setSelectedFilter(0)}
                        className={`dos border hover:cursor-pointer px-2 ${selectedFilter == 0 ? ("selected") : ("")}`}>By Title
                </button>
                <button onClick={() => setSelectedFilter(1)}
                        className={`dos border hover:cursor-pointer px-2 ${selectedFilter == 1 ? ("selected") : ("")}`}>By Artist
                </button>
            </div>
            <div
                className="flex sm:justify-center overflow-y-auto sm:flex-wrap mt-3 mb-3 sm:mt-1 px-1 gap-3 flex-col sm:flex-row">


                {filteredAssets.map((a) => (
                    <div onClick={() => setAssetId(a.id)} className="flex hover:cursor-pointer flex-col" key={a.id}>
                        <div className="mx-auto size-50 border relative">
                            <img className="absolute  mx-auto object-contain w-full h-full " alt="thumbnail"
                                 src={a.thumbnailUrl}/>
                            <div className="absolute px-1 top-0 h-10 w-full flex items-center flex-col bg-black/50">
                                <div className="dos line-clamp-1 my-auto text-center">{a.name}</div>
                            </div>
                            <div className="absolute px-1 bottom-0 h-20 w-full flex flex-col bg-black/50">
                                <div className="dos">Rating: N/A</div>
                                <div className="dos truncate">By: {a.artistName} </div>
                                <div className="dos text-center mt-auto">{humanDate(a.createdAt ?? "")}</div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

        </>
    );
}

function humanDate(date: string): string {
    let newDate = new Date(date);
    return newDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

function AssetForm({item, asset, setIsNavigating}: {
    item: number,
    asset: Asset | null,
    setIsNavigating: (value: boolean) => void
}) {

    const {isLoading, setIsLoading} = useLoading();
    
    const [width, setWidth] = useState("w-50");
    const [height, setHeight] = useState("h-50");
    const [preview, setPreview] = useState(asset?.thumbnailUrl != null ? (asset?.thumbnailUrl) : ("http://10.0.0.131:5130/uploads/thumbnails/picture.png"))
    const [artistId, setArtistId] = useState(asset?.artistId ?? 0);
    const [selectedOption, setSelectedOption] = useState(asset?.type?.toString() ?? "1");
    const [error, setError] = useState("");

    useEffect(() => {
        if (item != 1) {
            setWidth("w-50");
            setHeight("h-50");
            setSelectedOption("1")
        } else {
            switch (selectedOption) {
                case "0":
                    setWidth("w-50");
                    setHeight("h-40");
                    break;
                case "1":
                    setWidth("w-50");
                    setHeight("h-50");
                    break;
                case "2":
                    setWidth("w-50");
                    setHeight("h-80");
                    break;
                case "3":
                    setWidth("w-50");
                    setHeight("h-66");
                    break;
            }
        }
    }, [selectedOption, item]);

    const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setSelectedOption(event.target.value);
    };
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true)
        const formData = new FormData(e.currentTarget);
        if (artistId == 0) {
            setError("Artist is required.")
            setIsLoading(false);
            return;
        }

        formData.set("artistId", artistId.toString())
        formData.set("type", selectedOption);
        formData.set("item", item.toString());
        formData.set("filename", "willBeHandledByServer")

        if (asset != null) {
            formData.set("id", asset.id.toString())
            try{
            let response = await apiCall(`http://10.0.0.131:5130/api/Assets/${asset.id}`, formData, "PUT");
            if (response.ok) {
                setIsNavigating(true);
            } else {
                let parsedResponse = await response.json();
                setError(parsedResponse.error);
            }}
            finally {
                setIsLoading(false);
            }
        } else {
            try
            {
                let response = await apiCall("http://10.0.0.131:5130/api/Assets", formData, "POST");
                if (response.ok) {
                    setIsLoading(false)
                    setIsNavigating(true);
                } else {
                    setIsLoading(false)
                    let parsedResponse = await response.json();
                    setError(parsedResponse.error);
                }
            }
            finally {
                setIsLoading(false);
            }
           
        }


    }

    return (
        <>
            <form encType="multipart/form-data"
                  className="flex px-2 flex-col mx-auto mt-1 shrink m-w-0 w-full max-w-120"
                  onSubmit={handleSubmit}>
                <div className="dos">{asset ? ("Editing") : ("Adding")} {ItemEnum[item]}</div>
                <hr></hr>
                <div>
                    <div className="dos w-full text-center">Thumbnail</div>
                    <div className={`relative mx-auto ${width} ${height} shrink-0 mb-1 border`}>
                        <input onChange={handleImageChange} accept="image/*"
                               className="absolute h-full opacity-0 hover:cursor-pointer  w-full" type="file"
                               name="thumbnail"/>
                        <img src={preview}
                             className="pointer-events-none object-contain object-center absolute border w-full h-full"
                             alt="bleeh"/>
                    </div>
                </div>
                <div className="justify-between flex flex-row">
                    <div className="dos">Attributes</div>
                    {error != "" ? (<div className="dos red">{error}</div>) : ("")}

                </div>

                <hr/>
                <div className="mt-2 flex flex-col gap-1">
                    <div className="flex relative flex-row">
                        <b className="red absolute left-1 dos mr-1">*</b>
                        <input defaultValue={asset?.name} name="name"
                               className="w-full h-6 border dos  text-center" type="text"
                               placeholder="Title"/>
                    </div>

                    <div className="flex items-center h-12 flex-row gap-1">
                        <div className="dos"><b className="red dos mr-1">*</b>Artist:</div>
                        <ArtistDropdown initialArtistId={asset?.artistId ?? null}
                                        onSelect={setArtistId}></ArtistDropdown>
                    </div>
                    {
                        item == 1 ? (<div className="flex mb-1 items-center flex-row gap-3">
                            <div className="dos"><b className="red dos mr-1">*</b>Ratio:</div>
                            <select value={selectedOption} onChange={handleChange}
                                    className="dos border w-full p-3 hover:cursor-pointer">
                                <option value="0">Horizontal (5 : 4)</option>
                                <option value="1">Square (1 : 1)</option>
                                <option value="2">Vertical (5 : 8)</option>
                                <option value="3">Table (3 : 4)</option>
                            </select>
                        </div>) : ("")

                    }
                    <textarea name="description"
                              className="w-full h-24 border dos  text-center"
                              placeholder="Description"
                              defaultValue={asset?.description}
                    />
                    <input name="source"
                           className="w-full h-6 border dos  text-center" type="text"
                           placeholder="Source"
                           defaultValue={asset?.description}
                    />
                    <div className="flex relative flex-row">
                        {asset ? ("") : (<><b className="red absolute left-1 dos mr-1">*</b>
                            <input name="file"
                                   className="w-full h-6 border dos  text-center" type="file"
                            /></>)}
                    </div>


                </div>
                <hr className="my-2"/>
                <div className="flex flex-row gap-1">
                    <button onClick={() => {
                        setArtistId(0);
                        setPreview("http://10.0.0.131:5130/uploads/thumbnails/picture.png")
                    }} className="dos url hover:cursor-pointer border w-2/10" type="reset">Reset
                    </button>
                    <button className="dos url hover:cursor-pointer border w-8/10" type="submit">Submit!</button>
                </div>

                {asset == null && item == 5 ? (<div>
                    <div className="dos mt-1">Note on 3D Models:</div>
                    <div className="dos">If you upload a megapack containing several 3D models, only the first 3D model
                        will be previewable.
                    </div>
                </div>) : ("")}

            </form>
        </>
    );
}

export async function FetchAsset(id: number): Promise<Asset> {
    const response = await apiCall(`http://10.0.0.131:5130/api/Assets/${id}`, null);
    const data = await response.json();
    return data;
}

export function ShowAsset({id, setId, setIsNavigating, setSelectedAsset, setTrigger}: {
    id: number,
    setId: (value: number) => void,
    setIsNavigating: (value: boolean) => void
    setSelectedAsset: (asset: Asset) => void,
    setTrigger: (trigger: number) => void,
}) {
    const [artist, setArtist] = useState<Artist | null>();
    const [asset, setAsset] = useState<Asset | null>();
    const [askConfirmation, setAskConfirmation] = useState(false);
    const {isAuthenticated, isAdmin, id: userId} = useAuth();
    const {isLoading, setIsLoading} = useLoading();
    useEffect(() => {
        setIsLoading(true);
        FetchAsset(id)
            .then(asset => {
                setAsset(asset);
                return FetchArtist(asset.artistId);
            })
            .then(artist => {
                setArtist(artist);
            })
            .catch(err => console.error(err)).finally(() => setIsLoading(false));
    }, [id]);

    async function deleteAsset(id: number) {
        let response = await apiCall(`http://10.0.0.131:5130/api/Assets/${id}`, new FormData(), "DELETE");
        if (response.ok) {
            setTrigger(Date.now())
            setId(0)
        } else {
            let parsedResponse = await response.json();
            alert(parsedResponse.title);
        }
    }

    return (
        <>
            <div className="fixed flex flex-col w-full h-full top-0 left-0 right-0 bottom-0 bg-black/50 z-10 ">

                <div
                    className="flex flex-col mx-auto my-auto w-full h-full sm:w-2/3 sm:h-4/5 bg-black border-2 overflow-hidden">
                    <div className="flex shrink-0 w-full gap-2 h-12 border-b-2 flex-row">
                        <div className="dos line-clamp-1 ml-2 text-2xl my-auto">{asset?.name}</div>
                        <button onClick={() => setId(0)}
                                className="dos shrink-0 border hover:cursor-pointer size-8 ml-auto my-auto m-1"
                                type="button">
                            <img src="https://votvbroadcast.com/images/cross.png"/>
                        </button>
                    </div>
                    <div className="flex flex-row w-full h-full overflow-hidden">
                        <div className="w-3/4 border-r flex flex-col h-full min-h-0">
                            {asset?.previewUrl != null ? (
                                    <div className="h-94.5">
                                        <Canvas camera={{position: [0, 0, 50], fov: 50}}>
                                            < ambientLight intensity={0.5}/>
                                            <directionalLight position={[5, 5, 5]}/>
                                            <Suspense fallback={null}>
                                                <Model url={asset.previewUrl}/>
                                            </Suspense>
                                            <OrbitControls autoRotate/>
                                        </Canvas>
                                    </div>
                                ) :
                                (<div className="shrink-0">
                                        <img className="h-94.5 w-full object-contain m-auto" src={asset?.thumbnailUrl}/>
                                    </div>
                                )}


                            <div className="flex p-1 flex-1 flex-col border-t min-h-0">
                                <div className="dos shrink-0">Description:</div>

                                <div className="dos overflow-y-auto flex-1 min-h-0">
                                    {asset?.description ?? "No description available"}
                                </div>
                            </div>
                        </div>
                        <div className="w-1/4 flex flex-col h-full">
                            <div className="flex flex-row">
                                <img className="size-25" src={artist?.pfpUrl}/>
                                <div className="dos line-clamp-1 ml-2 text-2xl my-auto">{artist?.name}</div>
                            </div>
                            <hr/>
                            <div className="flex flex-1 flex-col  min-h-0">
                                <div className="flex flex-col min-h-0 p-1 flex-1 mb-4">
                                    <div className="dos shrink-0">Artist Description:</div>
                                    <div className="dos overflow-y-auto">
                                        {artist?.description}
                                    </div>
                                </div>
                                <div className="flex border-t flex-col p-1 min-h-0 flex-1">
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
                    <div className="flex border-t shrink-0 w-full gap-2 h-12 flex-row">

                        <div className="flex flex-row ml-auto gap-1 mr-1">
                            {isAuthenticated ? (
                                (isAdmin || userId == (asset?.ownerId ?? 0)) ? (
                                    <>
                                        {askConfirmation ? (
                                            <button onClick={() => deleteAsset(asset?.id ?? 0)}
                                                    className="dos red shrink-0 border hover:cursor-pointer my-auto">
                                                <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                                    <img className="size-7"
                                                         src="https://votvbroadcast.com/images/trash2.png"/>
                                                    <div className="dos red my-auto">Confirm deletion</div>
                                                </div>
                                            </button>
                                        ) : (
                                            <button onClick={() => setAskConfirmation(true)}
                                                    className="dos shrink-0 border hover:cursor-pointer my-auto">
                                                <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                                    <img className="size-7"
                                                         src="https://votvbroadcast.com/images/trash.png"/>
                                                    <div className="dos my-auto">Delete</div>
                                                </div>
                                            </button>
                                        )}
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            FetchAsset(asset?.id ?? 0).then(data => setSelectedAsset(data));
                                            setIsNavigating(false);
                                        }}
                                                className="dos shrink-0 border hover:cursor-pointer my-auto">
                                            <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                                <img className="size-7"
                                                     src="https://votvbroadcast.com/images/pencil.png"/>
                                                <div className="dos my-auto">Edit</div>
                                            </div>
                                        </button>
                                    </>
                                ) : ("")
                            ) : ("")}
                            <button onClick={() => downloadFile(asset?.fileUrl ?? "", asset?.filename ?? "")}
                                    className="dos shrink-0 border hover:cursor-pointer my-auto">
                                <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                    <img className="size-7" src="https://votvbroadcast.com/images/download.png"/>
                                    <div className="dos my-auto">Download</div>
                                </div>


                            </button>

                        </div>

                    </div>
                </div>


            </div>
        </>
    )
}

function Model({url}: { url: string }) {
    const {scene} = useGLTF(url);
    return <primitive object={scene}/>;
}

function VCBAdvertisement({isNavigating}: { isNavigating: boolean }) {
    return (
        <>
            <div className="flex my-auto flex-col">
                <div className="dos text-center">
                    {isNavigating ? ("Searching for audio or video?") : ("Want to add audio or video?")}
                </div>
                <div className="mx-auto flex flex-row gap-2 ">
                    <div className="dos">You should visit</div>
                    <a href="" target="_blank" className="title url text-center">VotV
                        Community Broadcaster
                    </a>
                    <div className="dos">!</div>
                </div>
                <div className="dos text-center">VotV Community Broadcaster is a website that stores video and audio
                    and streams
                    it over the internet for Voices of the Void players!
                </div>
                <div className="title text-center text-2xl">Screenshots</div>
                <div className="flex gap-5 md:gap-2 flex-col md:flex-row">
                    <img className="w-full md:w-1/3" src="https://votvbroadcast.com/images/vcb_home.png"/>
                    <img className="w-full md:w-1/3" src="https://votvbroadcast.com/images/vcb_upload.png?v=2"/>
                    <img className="w-full md:w-1/3" src="https://votvbroadcast.com/images/vcb_ingame.png"/>
                </div>
                <a href="https://votvbroadcast.com/" target="_blank"
                   className="dos my-2 url border text-center p-2 mx-auto w-50">Visit
                    Now!</a>
            </div>

        </>
    )
}

