import React, {useEffect, useRef, useState} from "react";
import {Link} from "react-router";
import {useAuth} from '~/context/AuthContext';
import {apiCall} from "~/tsx/functions";
import {
    FaArtstation,
    FaDeviantart,
    FaFacebookF,
    FaGithub,
    FaInstagram,
    FaReddit,
    FaTumblr,
    FaTwitch,
    FaYoutube
} from "react-icons/fa";
import {FaBluesky, FaPixiv, FaXTwitter} from "react-icons/fa6";
import {GiBattleTank} from "react-icons/gi";
import {CiGlobe} from "react-icons/ci";

enum ItemEnum {
    Rug = 0,
    Picture = 1,
    Flag = 2,
    Sticker = 3,
    Poster = 4,
    "3D Model" = 5,
    "ATV Skin" = 6
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

enum TypeEnum {
    Horizontal = 0,
    Square = 1,
    Vertical = 2,
    Table = 3
}

interface Asset {
    id: number;
    ownerId: number;
    authorId: number;
    name: string;
    filename: string;
    item: ItemEnum;
    description?: string;
    thumbnail?: string;
    source?: string;
    tags?: string[];
    type?: TypeEnum;
}

interface Artist {
    id: number;
    ownerId: string;
    name: string;
    description?: string;
    socials?: string[];
    pfp?: string;
    pfpUrl?: string;
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
                            <AssetForm item={labelDictionary[selectedButton]} asset={null}/>)
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

async function FetchArtist(id: number): Promise<Artist> {
    const response = await apiCall(`http://10.0.0.131:5130/api/Artists/${id}`, null);
    const data = await response.json();
    return data;
}

function ShowArtist({id, setId}: { id: number, setId: (value: number) => void }) {
    const [artist, setArtist] = useState<Artist | null>();
    useEffect(() => {
        FetchArtist(id).then(data => setArtist(data));
    }, [id]);

    return (
        <>
            <div className="fixed flex flex-col w-full h-full top-0 left-0 right-0 bottom-0 bg-black/50 z-10 ">

                <div
                    className="flex flex-col mx-auto my-auto w-full h-full sm:w-2/3 sm:h-2/3 bg-black border-2 overflow-hidden">
                    <div className="flex shrink-0 w-full gap-2 h-28 border-b-2 flex-row">
                        <img className="border-r-2 w-28 h-full object-cover" alt="avatar" src={artist?.pfpUrl}/>
                        <div className="dos text-3xl my-auto">{artist?.name}</div>
                        <button onClick={() => setId(0)}
                                className="dos border hover:cursor-pointer size-8 ml-auto mb-auto m-1"
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

function DeleteArtist({id, setId, setDeleteArtist, setTrigger}: {
    id: number,
    setId: (value: number) => void,
    setDeleteArtist: (value: boolean) => void,
    setTrigger: (value: number) => void
}) {
    const [artist, setArtist] = useState<Artist | null>();
    useEffect(() => {
        FetchArtist(id).then(data => setArtist(data));
    }, [id]);

    async function sendDelete(id: number) {
        let response = await apiCall(`http://10.0.0.131:5130/api/Artists/${id}`, new FormData(), "DELETE");
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
                    <div className="text-center text-2xl   dos">Are you sure you want to
                        delete <br/>[{artist?.name}]
                        <br/> ?
                    </div>
                    <div className="dos red text-center mt-auto mb-auto text-xl">If you delete this artist, all assets
                        assigned to
                        them
                        will also be
                        deleted
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


function GenerateSocial({url}: { url: string }) {
    let lowUrl = url.toLowerCase()
    let social = <a className="flex flex-row gap-1 dos"></a>
    if (lowUrl.includes("github.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaGithub className="dos my-auto"/>GitHub</a>
    else if (lowUrl.includes("deviantart.com"))
        social = <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaDeviantart
            className="dos my-auto"/>DeviantArt</a>
    else if (lowUrl.includes("bsky.app"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaBluesky className="dos my-auto"/>BlueSky</a>
    else if (lowUrl.includes("x.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaXTwitter className="dos my-auto"/>Twitter</a>
    else if (lowUrl.includes("tumblr.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaTumblr className="dos my-auto"/>Tumblr</a>
    else if (lowUrl.includes("facebook.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaFacebookF className="dos my-auto"/>Facebook</a>
    else if (lowUrl.includes("reddit.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaReddit className="dos my-auto"/>Reddit</a>
    else if (lowUrl.includes("newgrounds.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><GiBattleTank
                className="dos my-auto"/>NewGrounds</a>
    else if (lowUrl.includes("youtube.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaYoutube className="dos my-auto"/>YouTube</a>
    else if (lowUrl.includes("pixiv.net"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaPixiv className="dos my-auto"/>Pixiv</a>
    else if (lowUrl.includes("twitch.tv"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaTwitch className="dos my-auto"/>Twitch</a>
    else if (lowUrl.includes("instagram.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaInstagram className="dos my-auto"/>Instagram</a>
    else if (lowUrl.includes("artstation.com"))
        social =
            <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><FaArtstation
                className="dos my-auto"/>ArtStation</a>
    else
        social = <a target="_blank" href={url} className="flex url flex-row gap-1 dos"><CiGlobe
            className="dos my-auto"/>{url}</a>
    return social
}

function FetchArtists({setSelectedArtist, setIsNavigating}: {
    setSelectedArtist: (artist: Artist | null) => void,
    setIsNavigating: (value: boolean) => void
}) {
    const {isAuthenticated, id, isAdmin} = useAuth();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [artistId, setArtistId] = useState(0);
    const [deleteArtist, setDeleteArtist] = useState(false);
    const [trigger, setTrigger] = useState(0);

    useEffect(() => {
        apiCall("http://10.0.0.131:5130/api/Artists", null).then(res => res.json())
            .then(data => setArtists(data))
            .catch(err => console.error('Failed to fetch artists:', err));
    }, [trigger]);

    return (
        <>
            {artistId != 0 ? (deleteArtist ? (
                <DeleteArtist id={artistId} setId={setArtistId} setDeleteArtist={setDeleteArtist}
                              setTrigger={setTrigger}/>) : (
                <ShowArtist id={artistId} setId={setArtistId}/>)) : ("")}
            <div className="flex flex-col">
                <div className="dos w-full purple text-center border-b">Click on an artist to see their socials and
                    a
                    description about them
                </div>
                {artists.map((a) => (
                        <div onClick={() => setArtistId(a.id)} key={a.id}
                             className="flex flex-row gap-1 hover:cursor-pointer border-b">
                            <img className="w-12 h-12 border-r" src={a.pfpUrl} alt="Avatar"/>
                            <div className="flex flex-col gap-3">
                                <div className="dos my-auto">{a.name}</div>
                            </div>
                            <div className="flex flex-row gap-1 ml-auto mr-1 my-auto">
                                {isAuthenticated ? (isAdmin || id == a.ownerId ? (<>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setArtistId(a.id);
                                                setDeleteArtist(true);
                                            }}
                                            className="dos hover:cursor-pointer sm:pr-6 px-2 py-1 border-2 flex flex-row gap-2">
                                            <img className="size-6" src="https://votvbroadcast.com/images/trash.png"/>
                                            <div className="hidden sm:flex">Delete</div>
                                        </button>
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            FetchArtist(a.id).then(data => setSelectedArtist(data));
                                            setIsNavigating(false);
                                        }}
                                                className="dos hover:cursor-pointer sm:pr-6 px-2 py-1 border-2 flex flex-row gap-2">
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
        </>
    )
}

function AssetForm({item, asset}: {
    item: number,
    asset: Asset | null,
}) {

    const [width, setWidth] = useState("w-50");
    const [height, setHeight] = useState("h-50");
    const [preview, setPreview] = useState("http://10.0.0.131:5130/uploads/thumbnails/picture.png")
    const [artistId, setArtistId] = useState(0);
    const [selectedOption, setSelectedOption] = useState("1");

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
                <div className="dos">Attributes</div>
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

function ArtistDropdown({onSelect}: { onSelect: (id: number) => void }) {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<Artist | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        apiCall("http://10.0.0.131:5130/api/Artists", null)
            .then(res => res.json())
            .then(setArtists);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const filtered = artists.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    const select = (artist: Artist) => {
        setSearch(artist.name);
        setSelected(artist);
        onSelect(artist.id);
        setIsOpen(false);
    };

    return (
        <div ref={ref} className="relative w-full">
            <div className="relative">
                {selected && (
                    <img
                        className="absolute left-0.5 top-1/2 -translate-y-1/2 size-10 border-r dos pointer-events-none"
                        src={selected.pfpUrl}
                        alt={selected.name}
                    />
                )}
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search artists..."
                    className={`w-full border bg-black dos p-2 ${selected ? 'pl-12' : ''}`}
                />
            </div>

            {isOpen && filtered.length > 0 ? (
                <div className="absolute z-50 w-full bg-black border border-t-0 max-h-60 overflow-y-auto">
                    {filtered.map(a => (
                        <div
                            key={a.id}
                            onClick={() => select(a)}
                            className="flex flex-row gap-1 h-12 border-b border-white items-center hover:cursor-pointer dos">
                            <img className="size-11.75" src={a.pfpUrl} alt="pfp"/>
                            {a.name}
                        </div>
                    ))}
                </div>
            ) : ("")}
        </div>
    );
}

function ArtistForm({setIsNavigating, artist, setSelectedArtist}: {
    setIsNavigating: (bool: boolean) => void,
    artist: Artist | null,
    setSelectedArtist: (artist: Artist | null) => void
}) {
    const [socials, setSocials] = useState<string[]>(artist?.socials ?? []);
    const [preview, setPreview] = useState<string>(artist?.pfpUrl ?? "http://10.0.0.131:5130/uploads/avatars/defaultPicture.png")
    const [error, setError] = useState("");

    useEffect(() => {
        setSocials(artist?.socials ?? []);
        setPreview(artist?.pfpUrl ?? "http://10.0.0.131:5130/uploads/avatars/defaultPicture.png");
    }, [artist]);

    const addField = () => {
        if (socials.length < 10)
            setSocials([...socials, ""]);
    };

    const removeField = (index: number) => {
        setSocials(socials.filter((_, i) => i !== index));
    }

    const handleInputChange = (index: number, value: string) => {
        const newSocials = [...socials];
        newSocials[index] = value;
        setSocials(newSocials);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        let trimmedSocials = socials.filter(s => s != null && s !== '').map(s => s.trim()).filter(s => s);
        if (trimmedSocials.length > 0) {
            trimmedSocials.forEach(social => {
                formData.append("socials", social);
            });
        }

        if (artist != null) {
            formData.set("id", artist.id.toString())
            formData.set("pfp", artist.pfp ?? "")
            let response = await apiCall(`http://10.0.0.131:5130/api/Artists/${artist.id}`, formData, "PUT");
            if (response.ok) {
                setIsNavigating(true);
                setSelectedArtist(null);
            } else {
                let parsedResponse = await response.json()
                setError(parsedResponse.error);
            }
        } else {
            let response = await apiCall("http://10.0.0.131:5130/api/Artists", formData);
            if (response.ok) {
                setIsNavigating(true);
            } else {
                let parsedResponse = await response.json()
                setError(parsedResponse.error);
            }
        }


    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
        }
    };

    return (
        <>
            <form encType="multipart/form-data"
                  className="flex px-2 flex-col mx-auto mt-1 shrink m-w-0 w-full max-w-120"
                  onSubmit={handleSubmit}>
                <div className="dos">{artist ? ("Editing") : ("Adding")} an artist</div>
                <hr></hr>
                <div>
                    <div className="flex flex-row">
                        <div className="text-center w-full dos">Informations</div>
                        <div className="text-center ml-auto w-36 dos">Avatar</div>
                    </div>
                    <div className="flex flex-row gap-2">
                        <div className="flex flex-col gap-1 w-full">
                            {error ? (<div className="dos red">{error}</div>) : ("")}
                            <div className="flex relative flex-row">
                                <b className="red absolute left-1 dos mr-1">*</b>
                                <input defaultValue={artist?.name} name="name"
                                       className="w-full h-6 border dos  text-center" type="text"
                                       placeholder="Username"/>
                            </div>
                            <textarea defaultValue={artist?.description} name="description"
                                      className="w-full h-full border dos  text-center"
                                      placeholder="Description"/>
                        </div>
                        <div className="relative w-28 h-28 shrink-0 ml-auto border">
                            <input onChange={handleImageChange} accept="image/*"
                                   className="absolute h-full opacity-0 hover:cursor-pointer  w-full" type="file"
                                   name="avatar"/>
                            <img src={preview} className="pointer-events-none absolute border w-full h-full"
                                 alt="bleeh"/>
                        </div>

                    </div>
                </div>
                <div className="flex flex-row mx-auto gap-1">
                    <div className="dos">Socials</div>
                    <button type="button" onClick={addField}
                            className="dos hover:cursor-pointer url">[+]
                    </button>
                </div>
                <div className="flex flex-col gap-1">
                    {socials.map((link, index) => (
                        <div className="flex flex-row gap-1 w-full">
                            <input type="text" className="dos w-full text-center border"
                                   placeholder="Enter social link..."
                                   value={link} onChange={(e) => handleInputChange(index, e.target.value)}/>
                            <button type="button" onClick={() => removeField(index)}
                                    className="dos hover:cursor-pointer url">[-]
                            </button>
                        </div>
                    ))}
                </div>
                <button type="submit" className="border url hover:cursor-pointer mt-3 dos">Submit!</button>

            </form>
        </>
    )
}

