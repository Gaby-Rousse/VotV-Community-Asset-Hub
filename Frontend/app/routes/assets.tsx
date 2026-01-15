import React, {useEffect, useState} from "react";
import {Link} from "react-router";
import {useAuth} from '~/context/AuthContext';
import {apiCall, downloadFile, GenerateSocial} from "~/tsx/functions";
import type Artist from "~/models/interfaces/Artist";
import {ArtistDropdown, ArtistForm, FetchArtist, FetchArtists} from "~/tsx/artists";
import type Asset from "~/models/interfaces/Asset";
import ItemEnum from "~/models/enums/ItemEnum";


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
        setIsNavigating(!isNavigating);
    };

    return (
        <>
            <div className="md:border-3 border-solid h-screen bg-black flex flex-col p-0.5">
                <Nav isAuthenticated={isAuthenticated} isNavigating={isNavigating} toggleNavigating={toggleNavigating}
                     selectedButton={selectedButton}
                     setSelectedButton={setSelectedButton}></Nav>
                {isNavigating ? (
                        selectedButton === "Artists" ? (
                            <FetchArtists setSelectedArtist={setSelectedArtist} setIsNavigating={setIsNavigating}/>) : (
                            <FetchAssets item={labelDictionary[selectedButton]}
                                         setIsNavigating={setIsNavigating} setSelectedAsset={setSelectedAsset}/>)
                    ) :
                    (selectedButton === "Artists" ? (
                            <ArtistForm key={selectedArtist?.id ?? "new-artist"} setIsNavigating={setIsNavigating}
                                        setSelectedArtist={setSelectedArtist}
                                        artist={selectedArtist}/>) : (
                            <AssetForm item={labelDictionary[selectedButton]} asset={selectedAsset}
                                       setIsNavigating={setIsNavigating}/>)
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


    useEffect(() => {
        apiCall("http://10.0.0.131:5130/api/Assets?item=" + item, null).then(res => res.json())
            .then(data => setAssets(data))
            .catch(err => console.error('Failed to fetch assets:', err));
    }, [item]);

    return (
        <>
            {assetId != 0 ? (<ShowAsset id={assetId} setId={setAssetId} setSelectedAsset={setSelectedAsset}
                                        setIsNavigating={setIsNavigating}/>) : ("")}
            <div
                className="flex sm:justify-center overflow-y-auto sm:flex-wrap mt-3 mb-3 sm:mt-1 px-1 gap-3 flex-col sm:flex-row">
                {assets.map((a) => (
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

    const [width, setWidth] = useState("w-50");
    const [height, setHeight] = useState("h-50");
    const [preview, setPreview] = useState(asset?.thumbnailUrl != null ? (asset?.thumbnailUrl) : ("http://10.0.0.131:5130/uploads/thumbnails/picture.png"))
    const [artistId, setArtistId] = useState(0);
    const [selectedOption, setSelectedOption] = useState("1");
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

        const formData = new FormData(e.currentTarget);
        if (artistId == 0) {
            setError("Artist is required.")
            return;
        }

        formData.set("artistId", artistId.toString())
        formData.set("type", selectedOption);
        formData.set("item", item.toString());
        formData.set("filename", "willBeHandledByServer")

        let response = await apiCall("http://10.0.0.131:5130/api/Assets", formData, "POST");
        if (response.ok) {
            setIsNavigating(true);
        } else {
            let parsedResponse = await response.json();
            setError(parsedResponse.error);
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
                        <input name="name"
                               className="w-full h-6 border dos  text-center" type="text"
                               placeholder="Title"/>
                    </div>

                    <div className="flex items-center h-12 flex-row gap-1">
                        <div className="dos"><b className="red dos mr-1">*</b>Artist:</div>
                        <ArtistDropdown onSelect={setArtistId}></ArtistDropdown>
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
                              placeholder="Description"/>
                    <input name="source"
                           className="w-full h-6 border dos  text-center" type="text"
                           placeholder="Source"/>
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

            </form>
        </>
    );
}

export async function FetchAsset(id: number): Promise<Asset> {
    const response = await apiCall(`http://10.0.0.131:5130/api/Assets/${id}`, null);
    const data = await response.json();
    return data;
}

export function ShowAsset({id, setId, setIsNavigating, setSelectedAsset}: {
    id: number,
    setId: (value: number) => void,
    setIsNavigating: (value: boolean) => void
    setSelectedAsset: (asset: Asset) => void,
}) {
    const [artist, setArtist] = useState<Artist | null>();
    const [asset, setAsset] = useState<Asset | null>();
    useEffect(() => {
        FetchAsset(id)
            .then(asset => {
                setAsset(asset);
                return FetchArtist(asset.artistId);
            })
            .then(artist => {
                setArtist(artist);
            })
            .catch(err => console.error(err));
    }, [id]);

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
                        <div className="w-3/4 border-r flex flex-col h-full min-h-0"> {/* added min-h-0 */}
                            <div className="shrink-0">
                                <img className="h-94.5 w-full object-contain m-auto" src={asset?.thumbnailUrl}/>
                            </div>

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
                            <button onClick={() => downloadFile(asset?.fileUrl ?? "", asset?.filename ?? "")}
                                    className="dos shrink-0 border hover:cursor-pointer my-auto">
                                <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                    <img className="size-7" src="https://votvbroadcast.com/images/trash.png"/>
                                    <div className="dos my-auto">Delete</div>
                                </div>


                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                FetchAsset(asset?.id ?? 0).then(data => setSelectedAsset(data));
                                setIsNavigating(false);
                            }}
                                    className="dos shrink-0 border hover:cursor-pointer my-auto">
                                <div className="flex flex-row gap-1 py-0.5 pl-2 pr-4">
                                    <img className="size-7" src="https://votvbroadcast.com/images/pencil.png"/>
                                    <div className="dos my-auto">Edit</div>
                                </div>


                            </button>
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

