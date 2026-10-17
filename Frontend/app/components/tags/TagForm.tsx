import {useLoading} from "~/context/LoadingContext";
import {useEffect, useState} from "react";
import {apiCall} from "~/components/Functions";
import ItemEnum from "~/models/enums/ItemEnum";
import ArtistDropdown from "~/components/artists/ArtistDropdown";
import AdvancedFields from "~/components/other/AdvancedFields";
import type Tag from "~/models/interfaces/Tag";

export default function TagForm({tag, setIsNavigating}: {
    tag: Tag | null,
    setIsNavigating: (value: boolean) => void
}) {

    const {isLoading, setIsLoading} = useLoading();

    console.log(tag)

    const [preview, setPreview] = useState(tag?.thumbnailUrl != null ? (tag?.thumbnailUrl) : ("/uploads/thumbnails/picture.png"))
    const [error, setError] = useState("");

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

        if (tag != null) {
            formData.set("id", tag.id.toString())
            try {
                let response = await apiCall(`/api/Tags/${tag.id}`, formData, "PUT");
                if (response.ok) {
                    setIsNavigating(true);
                } else {
                    let parsedResponse = await response.json();
                    setError(parsedResponse.error);
                }
            } finally {
                setIsLoading(false);
            }
        }
    }

    if(tag == null)
    {
        return (
            <div className="dos text-xl m-auto text-center">
                Collections can't be created here.<br/>
                To make one, add a tag to your assets. Each tag is a collection.
            </div>
        );
    }


    return (
        <>
            <div className="flex overflow-auto px-2 flex-col mx-auto mt-1 shrink m-w-0 w-full max-w-125">
                <form encType="multipart/form-data" onSubmit={handleSubmit}>
                    <div className="dos">Editing tag</div>
                    <hr></hr>
                    <div>
                        <div className="dos w-full text-center">Thumbnail</div>
                        <div className="relative h-50 mx-auto w-50 shrink-0 mb-1 border">
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
                            <input defaultValue={tag?.name} name="name"
                                   className="w-full h-6 border dos text-center" type="text"
                                   placeholder="Name"/>
                        </div>
                        <textarea name="description"
                                  className="w-full h-24 border dos text-center"
                                  placeholder="Description"
                                  defaultValue={tag?.description}
                        />
                    </div>
                    <hr className="my-2" />
                    <div className="flex flex-row gap-1">
                        <button onClick={() => {
                            setPreview("/uploads/thumbnails/picture.png")
                        }} className="dos url hover:cursor-pointer border w-2/10" type="reset">Reset
                        </button>
                        <button className="dos url hover:cursor-pointer border w-8/10" type="submit">Submit!</button>
                    </div>
                </form>
            </div>
        </>
    );
}