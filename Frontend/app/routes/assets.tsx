import React, {useEffect, useState} from "react";
import {Link} from "react-router";
import {useAuth} from '~/context/AuthContext';
import {apiCall, GenerateSocial} from "~/tsx/functions";
import type Artist from "~/models/interfaces/Artist";
import {ArtistDropdown, ArtistForm, FetchArtists} from "~/tsx/artists";
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
                            <FetchAssets item={labelDictionary[selectedButton]}/>)
                    ) :
                    (selectedButton === "Artists" ? (
                            <ArtistForm key={selectedArtist?.id ?? "new-artist"} setIsNavigating={setIsNavigating}
                                        setSelectedArtist={setSelectedArtist}
                                        artist={selectedArtist}/>) : (
                            <AssetForm item={labelDictionary[selectedButton]} asset={null}
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
function FetchAssets({item}: {
    item: number,
}) {
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        apiCall("http://10.0.0.131:5130/api/Assets?item=" + item, null).then(res => res.json())
            .then(data => setAssets(data))
            .catch(err => console.error('Failed to fetch assets:', err));
    }, [item]);

    return (
        <>
            <ul>
                {assets.map((a) => (
                    <li key={a.id}>{a.name}</li>
                ))}
            </ul>
        </>
    );
}



function AssetForm({item, asset, setIsNavigating}: {
    item: number,
    asset: Asset | null,
    setIsNavigating: (value: boolean) => void
}) {

    const [width, setWidth] = useState("w-50");
    const [height, setHeight] = useState("h-50");
    const [preview, setPreview] = useState("http://10.0.0.131:5130/uploads/thumbnails/picture.png")
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
                        <b className="red absolute left-1 dos mr-1">*</b>
                        <input name="file"
                               className="w-full h-6 border dos  text-center" type="file"
                        />
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



