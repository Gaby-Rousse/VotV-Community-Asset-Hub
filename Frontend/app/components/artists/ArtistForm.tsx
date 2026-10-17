import type Artist from "~/models/interfaces/Artist";
import {useEffect, useState} from "react";
import {useLoading} from "~/context/LoadingContext";
import {apiCall} from "~/components/Functions";
import AdvancedFields from "~/components/other/AdvancedFields";

export default function ArtistForm({setIsNavigating, artist, setSelectedArtist}: {
    setIsNavigating: (bool: boolean) => void,
    artist: Artist | null,
    setSelectedArtist: (artist: Artist | null) => void
}) {
    const [socials, setSocials] = useState<string[]>(artist?.socials ?? []);
    const [preview, setPreview] = useState<string>(artist?.pfpUrl ?? "/uploads/avatars/defaultPicture.png")
    const [error, setError] = useState("");

    const {isLoading, setIsLoading} = useLoading();

    useEffect(() => {
        setSocials(artist?.socials ?? []);
        setPreview(artist?.pfpUrl ?? "/uploads/avatars/defaultPicture.png");
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

        let trimmedSocials = socials.filter(s => s?.trim())
        if (trimmedSocials.length > 0) {
            trimmedSocials.forEach(social => {
                formData.append("socials", social);
            });
        }

        if (artist != null) {
            try {
                setIsLoading(true)
                formData.set("id", artist.id.toString())
                formData.set("pfp", artist.pfp ?? "")

                let response = await apiCall(`/api/Artists/${artist.id}`, formData, "PUT");
                if (response.ok) {
                    setIsNavigating(true);
                    setSelectedArtist(null);
                } else {
                    let parsedResponse = await response.json()
                    setError(parsedResponse.error);
                }
            } finally {
                setIsLoading(false)
            }
        } else {
            try {

                setIsLoading(true)
                let response = await apiCall("/api/Artists", formData);
                if (response.ok) {
                    setIsNavigating(true);
                } else {
                    let parsedResponse = await response.json()
                    setError(parsedResponse.error);
                }
            } finally {
                setIsLoading(false)
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
            <div className="flex px-2 flex-col mx-auto mt-1 shrink m-w-0 w-full max-w-125">
                <form encType="multipart/form-data"
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
                                className="dos hover:cursor-pointer ml-auto url">[+]
                        </button>
                    </div>
                    <hr className="mb-2"/>
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
                    <hr className="mt-2" />
                    <button type="submit" className="border url hover:cursor-pointer mt-3 w-full dos">Submit!</button>
                </form>

                <AdvancedFields asset={artist} setNavigating={setIsNavigating}/>
            </div>
        </>
    )
}

