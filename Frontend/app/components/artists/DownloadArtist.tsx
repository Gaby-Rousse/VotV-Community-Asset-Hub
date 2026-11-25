import ContentRatingEnum from "~/models/enums/ContentRatingEnum";
import React, {useEffect, useState} from "react";
import {apiCall} from "~/components/Functions";
import RatingCheckboxInput from "~/components/other/RatingCheckboxInput";

export default function DownloadArtist({id,setId,setDownloadArtist}:{id:number, setId:(value:number) => void, setDownloadArtist:(value:boolean) => void}) {

    const [ratingsCount, setRatingsCount] = useState<{g: number, q: number, e: number}>();
    const [ratings, setRatings] = useState<ContentRatingEnum[]>([ContentRatingEnum.General])
    const [downloadCount, setDownloadCount] = useState(0);

    function closeModal() {
        setId(0);
        setDownloadArtist(false);
    }

    useEffect(() => {
        apiCall(`/api/artists/${id}/ratingsCount`, null, "GET").then(res => res.json())
            .then(response => {
                setRatingsCount(response.ratingsCount);
            })
            .catch(err => console.error(err));
    }, [id]);

    useEffect(() => {
        if(ratingsCount == undefined)
            return;
        let count = 0;

        if(ratingsCount.q == 0 && ratingsCount.e == 0) {
            //skip question
            downloadArtist(id, [ContentRatingEnum.General])
            closeModal()
        }

        if(ratings.includes(ContentRatingEnum.General))
        {
            count += ratingsCount.g ?? 0
        }
        if(ratings.includes(ContentRatingEnum.Questionable))
        {
            count += ratingsCount.q ?? 0
        }
        if(ratings.includes(ContentRatingEnum.Explicit))
        {
            count += ratingsCount.e ?? 0
        }

        setDownloadCount(count);
    }, [ratingsCount, ratings]);

    if(ratingsCount != undefined && (ratingsCount.q != 0 || ratingsCount.e != 0))
    return (
    <div className="fixed text-xl dos inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="lg:w-1/2 p-2 w-full flex flex-col gap-2 bg-black border-2 border-white">
            <button onClick={() => closeModal()}
                    className="dos shrink-0 border hover:cursor-pointer size-8 ml-auto mb-auto m-1"
                    type="button">
                <img src="https://votvbroadcast.com/images/cross.png"/>
            </button>
            <div>This artist has various ratings. Which content do you want to download?</div>
            <RatingCheckboxInput setReaderValue={setRatings} ratingsCount={ratingsCount} oldValue={ratings}/>
            <div onClick={() => {
                downloadArtist(id, ratings)}}
                 className="ml-auto dos gap-1 mt-10 shrink-0 text-center border-2 px-1 md:px-2 py-1 flex flex-row">
                <img className="my-auto size-6" src="https://cdn.votvbroadcast.com/public/assets/download.png?v=2" />
                <div className="hidden md:flex">Download {downloadCount}</div>
            </div>
        </div>
    </div>
        )
}

export function downloadArtist(id: number, ratings: ContentRatingEnum[]): void {
    const params = new URLSearchParams();
    ratings.forEach(r => params.append("ratings", String(r)));
    const a = document.createElement("a");
    a.href = `${import.meta.env.VITE_API_URL ?? ""}/api/Artists/${id}/download?${params}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}