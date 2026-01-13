import React, {useEffect, useState} from "react";
import {Link} from "react-router";
import {useAuth} from '~/context/AuthContext';
import {apiCall} from "~/routes/functions";


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
    name: string;
    description?: string;
    socials?: string[];
    pfp?: string;
    pfpUrl?: string;
}


export default function Assets() {

    const [selectedButton, setSelectedButton] = useState("3D Models");
    const [isNavigating, setIsNavigating] = useState(true);
    const {isAuthenticated} = useAuth();
    const toggleNavigating = () => {
        setIsNavigating(!isNavigating);
    };

    return (
        <>
            <div className="md:border-3 border-solid h-screen bg-black flex flex-col p-0.5">
                <Nav isAuthenticated={isAuthenticated} isNavigating={isNavigating} toggleNavigating={toggleNavigating}
                     selectedButton={selectedButton}
                     setSelectedButton={setSelectedButton}></Nav>
                {isNavigating ? (
                        selectedButton === "Artists" ? (<FetchArtists/>) : (
                            <FetchAssets item={labelDictionary[selectedButton]}/>)
                    ) :
                    (selectedButton === "Artists" ? (<CreateArtist setIsNavigating={setIsNavigating}/>) : (
                            <CreateAsset item={labelDictionary[selectedButton]}/>)
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

function FetchArtists() {
    const [artists, setArtists] = useState<Artist[]>([]);

    useEffect(() => {
        apiCall("http://10.0.0.131:5130/api/Artists", null).then(res => res.json())
            .then(data => setArtists(data))
            .catch(err => console.error('Failed to fetch assets:', err));
    }, []);

    return (
        <>
            <div className="flex flex-col">
                {artists.map((a) => (
                    <div key={a.id} className="flex flex-row gap-1 border-b">
                        <img className="w-25 h-25 border-r" src={a.pfpUrl} alt="Avatar"/>
                        <div className="flex flex-col gap-3">
                            <div className="dos">{a.name}</div>
                            <div className="dos overflow-y-auto">{a.description}</div>
                        </div>

                        <div className="flex flex-row gap-1 ml-auto mb-1 mr-1 mt-auto">
                            <button className="dos px-6 py-1 border-2">Delete</button>
                            <button className="dos px-6 py-1 border-2">Edit</button>
                            <button className="dos px-6 py-1 border-2">See assets from them</button>

                        </div>

                    </div>
                ))}
            </div>
        </>
    );
}

function CreateAsset({item}: {
    item: number,
}) {
    return (
        <>
            <h2>Adding a {ItemEnum[item]}</h2>
        </>
    );
}

function CreateArtist({setIsNavigating}: { setIsNavigating: (bool: boolean) => void }) {
    const [socials, setSocials] = useState<string[]>([]);
    const [preview, setPreview] = useState<string>("https://www.babelchat.iblr.ca/images/defaultPicture.jpg")

    const addField = () => {
        if (socials.length < 6)
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

        let trimmedSocials = socials.map(s => s.trim());
        if (trimmedSocials.length > 0) {
            trimmedSocials.forEach(social => {
                formData.append("socials[]", social);
            });
        }

        let response = await apiCall("http://10.0.0.131:5130/api/Artists", formData);
        if (response.ok) {
            setIsNavigating(true);
        } else {
            alert("Error");
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
                <div className="dos">Adding an artist</div>
                <hr></hr>
                <div>
                    <div className="flex flex-row">
                        <div className="text-center w-full dos">Informations</div>
                        <div className="text-center ml-auto w-36 dos">Avatar</div>
                    </div>
                    <div className="flex flex-row gap-2">
                        <div className="flex flex-col gap-1 w-full">
                            <input name="name" className="w-full h-6 border dos  text-center" type="text"
                                   placeholder="Username"/>
                            <textarea name="description" className="w-full h-full border dos  text-center"
                                      placeholder="Description"/>
                        </div>
                        <div className="relative w-28 h-28 shrink-0 ml-auto border">
                            <input onChange={handleImageChange} accept="image/*"
                                   className="absolute h-full opacity-0  w-full" type="file"
                                   name="avatar"/>
                            <img src={preview} className="pointer-events-none absolute border w-full h-full"
                                 alt="bleeh"/>
                        </div>

                    </div>
                </div>
                <div className="flex flex-row mx-auto gap-1">
                    <div className="dos">Socials</div>
                    <button type="button" onClick={addField} className="dos hover:cursor-pointer">[+]</button>
                </div>
                <div className="flex flex-col gap-1">
                    {socials.map((link, index) => (
                        <div className="flex flex-row gap-1 w-full">
                            <input type="text" className="dos w-full text-center border"
                                   placeholder="Enter social link..."
                                   value={link} onChange={(e) => handleInputChange(index, e.target.value)}/>
                            <button type="button" onClick={() => removeField(index)}
                                    className="dos hover:cursor-pointer">[-]
                            </button>
                        </div>
                    ))}
                </div>
                <button type="submit" className="border mt-3 dos">Submit!</button>

            </form>
        </>
    );
}

