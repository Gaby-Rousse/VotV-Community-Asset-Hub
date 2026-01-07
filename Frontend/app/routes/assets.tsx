import {useEffect, useState} from "react";
import {Link} from "react-router";
import {useAuth} from '~/context/AuthContext';


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
                    (selectedButton === "Artists" ? (<CreateArtist/>) : (
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

function FetchAssets({item}: {
    item: number,
}) {
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        fetch("http://10.0.0.131:5130/api/Asset?item=" + item)
            .then((res) => res.json())
            .then((data) => setAssets(data))
            .catch((err) => console.error("Error:", err));
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
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        fetch("http://10.0.0.131:5130/api/Asset")
            .then((res) => res.json())
            .then((data) => setAssets(data))
            .catch((err) => console.error("Error:", err));
    }, []);

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

function CreateAsset({item}: {
    item: number,
}) {
    return (
        <>
            <h2>Adding a {ItemEnum[item]}</h2>
        </>
    );
}

function CreateArtist() {
    return (
        <>
            <h2>Adding an artist!</h2>
        </>
    );
}

