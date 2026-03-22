import type Asset from "~/models/interfaces/Asset";
import {useLoading} from "~/context/LoadingContext";
import {useEffect, useState} from "react";
import {apiCall} from "~/components/Functions";
import ItemEnum from "~/models/enums/ItemEnum";
import ArtistDropdown from "~/components/artists/ArtistDropdown";
import AdvancedFields from "~/components/other/AdvancedFields";

export default function AssetForm({item, asset, setIsNavigating}: {
    item: number,
    asset: Asset | null,
    setIsNavigating: (value: boolean) => void
}) {

    const {isLoading, setIsLoading} = useLoading();

    const [ratio, setRatio] = useState("1/1")
    const [tags, setTags] = useState<string[]>(asset?.tags ?? []);
    const [preview, setPreview] = useState(asset?.thumbnailUrl != null ? (asset?.thumbnailUrl) : ("/uploads/thumbnails/picture.png"))
    const [artistId, setArtistId] = useState(asset?.artist.id ?? 0);
    const [selectedOption, setSelectedOption] = useState(asset?.type?.toString() ?? "1");
    const [error, setError] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

    useEffect(() => {
        setTags(asset?.tags ?? []);
    }, [asset]);

    const addField = () => {
        if (tags.length < 10)
            setTags([...tags, ""]);
    };

    const removeField = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    }

    useEffect(() => {
        if (item != 1) {
            setRatio("aspect-1/1")
            setSelectedOption("1")
        } else {
            switch (selectedOption) {
                case "0":
                    setRatio("aspect-5/4")
                    break;
                case "1":
                    setRatio("aspect-1/1")
                    break;
                case "2":
                    setRatio("aspect-5/8")
                    break;
                case "3":
                    setRatio("aspect-3/4")
                    break;
            }
        }
    }, [selectedOption, item]);

    const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setSelectedOption(event.target.value);
    };

    async function fetchSuggestions(prefix: string) {
        if (prefix.length === 0) {
            setSuggestions([]);
            return;
        }
        const res = await apiCall(`/api/Tags?prefix=${encodeURIComponent(prefix)}`, null, "GET");
        const data: { name: string, count: number }[] = await res.json();
        setSuggestions(data.map(t => t.name));
    }

    const handleInputChange = (index: number, value: string) => {
        const newTags = [...tags];
        newTags[index] = value.split(' ').join('_');
        setTags(newTags);
        setActiveSuggestionIndex(index);
        fetchSuggestions(value.replace(' ', '_'));
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

        let trimmedTags = tags.filter(t => t?.trim())
        if (trimmedTags.length > 0) {
            trimmedTags.forEach(tag => {
                formData.append("tags", tag);
            });
        }

        formData.set("artistId", artistId.toString())
        formData.set("type", selectedOption);
        formData.set("item", item.toString());
        formData.set("filename", "willBeHandledByServer")

        if (asset != null) {
            formData.set("id", asset.id.toString())
            try {
                let response = await apiCall(`/api/Assets/${asset.id}`, formData, "PUT");
                if (response.ok) {
                    setIsNavigating(true);
                } else {
                    let parsedResponse = await response.json();
                    setError(parsedResponse.error);
                }
            } finally {
                setIsLoading(false);
            }
        } else {
            try {
                let response = await apiCall("/api/Assets", formData, "POST");
                if (response.ok) {
                    setIsLoading(false)
                    setIsNavigating(true);
                } else {
                    setIsLoading(false)
                    let parsedResponse = await response.json();
                    setError(parsedResponse.error);
                }
            } finally {
                setIsLoading(false);
            }
        }
    }

    return (
        <>
            <div className="flex overflow-auto px-2 flex-col mx-auto mt-1 shrink m-w-0 w-full max-w-120">
                <form encType="multipart/form-data"

                      onSubmit={handleSubmit}>
                    <div className="dos">{asset ? ("Editing") : ("Adding")} {ItemEnum[item]}</div>
                    <hr></hr>
                    <div>
                        <div className="dos w-full text-center">Thumbnail</div>
                        <div className={`relative mx-auto w-50 ${ratio} shrink-0 mb-1 border`}>
                            <input onChange={handleImageChange} accept="image/*"
                                   className="absolute h-full opacity-0 hover:cursor-pointer w-full" type="file"
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
                                   className="w-full h-6 border dos text-center" type="text"
                                   placeholder="Title"/>
                        </div>
                        <div className="flex items-center h-12 flex-row gap-1">
                            <div className="dos"><b className="red dos mr-1">*</b>Artist:</div>
                            <ArtistDropdown initialArtistId={asset?.artist.id ?? null}
                                            onSelect={setArtistId}></ArtistDropdown>
                        </div>
                        {item == 1 ? (<div className="flex mb-1 items-center flex-row gap-3">
                            <div className="dos"><b className="red dos mr-1">*</b>Ratio:</div>
                            <select value={selectedOption} onChange={handleChange}
                                    className="dos border w-full p-3 hover:cursor-pointer">
                                <option value="0">Horizontal (5 : 4)</option>
                                <option value="1">Square (1 : 1)</option>
                                <option value="2">Vertical (5 : 8)</option>
                                <option value="3">Table (3 : 4)</option>
                            </select>
                        </div>) : ("")}
                        <textarea name="description"
                                  className="w-full h-24 border dos text-center"
                                  placeholder="Description"
                                  defaultValue={asset?.description}
                        />
                        <input name="source"
                               className="w-full h-6 border dos text-center" type="text"
                               placeholder="Source"
                               defaultValue={asset?.source}
                        />
                        <div className="flex relative flex-row">
                            {asset ? ("") : (<><b className="red absolute left-1 dos mr-1">*</b>
                                <input name="file"
                                       accept="image/*, .zip, .rar, .7zip, .7z"
                                       className="w-full h-6 border dos text-center" type="file"
                                /></>)}
                        </div>
                        {item == 5 ? (<>
                            <div className="dos">3D Preview:</div>
                            <hr className="mb-1"/>
                            <div className="flex flex-row">
                                <input accept=".glb" name="preview"
                                       className="w-full h-6 border dos text-center" type="file"
                                />
                            </div>
                            <div className="dos">If no preview is provided, the thumbnail will be used instead of the 3D
                                viewer.
                            </div>
                        </>) : ("")}
                    </div>
                    <div className="dos mt-2 flex flex-row justify-between">
                        <div>Tags:</div>
                        <button className="url" type="button" onClick={() => addField()}>[+]</button>
                    </div>
                    <hr className="my-2"/>
                    <div className="flex flex-col gap-1">
                        {tags.map((tag, index) => (
                            <div className="flex flex-col gap-0 w-full" key={index}>
                                <div className="flex flex-row gap-1 w-full">
                                    <input
                                        type="text"
                                        className="dos w-full text-center border"
                                        placeholder={`Tag [${index + 1}]`}
                                        value={tag}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                                    />
                                    <button type="button" onClick={() => removeField(index)}
                                            className="dos hover:cursor-pointer url">[-]
                                    </button>
                                </div>
                                {activeSuggestionIndex === index && suggestions.length > 0 && (
                                    <div className="border border-white bg-black z-20">
                                        {suggestions.map(s => (
                                            <div
                                                key={s}
                                                onMouseDown={() => {
                                                    const newTags = [...tags];
                                                    newTags[index] = s;
                                                    setTags(newTags);
                                                    setSuggestions([]);
                                                }}
                                                className="dos px-2 py-0.5 hover:cursor-pointer url">
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <hr className="my-2"/>
                    <div className="flex flex-row gap-1">
                        <button onClick={() => {
                            setArtistId(0);
                            setPreview("/uploads/thumbnails/picture.png")
                        }} className="dos url hover:cursor-pointer border w-2/10" type="reset">Reset
                        </button>
                        <button className="dos url hover:cursor-pointer border w-8/10" type="submit">Submit!</button>
                    </div>
                </form>
                <AdvancedFields asset={asset} setNavigating={setIsNavigating}/>
            </div>
        </>
    );
}