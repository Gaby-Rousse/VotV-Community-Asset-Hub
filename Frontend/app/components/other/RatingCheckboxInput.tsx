import {type ChangeEvent, useState} from 'react';
import ContentRatingEnum from "~/models/enums/ContentRatingEnum";
import {useAuth} from "~/context/AuthContext";
import {useConsent} from "~/context/ConsentContext";

export default function RatingCheckboxInput({setReaderValue, ratingsCount, oldValue, } : {setReaderValue: (value:ContentRatingEnum[]) => void, ratingsCount?: {g:number, q:number, e:number}, oldValue?:ContentRatingEnum[]}) {

    const requestConsent = useConsent();

    const selectedValue = oldValue ?? [ContentRatingEnum.General];
    const {isAuthenticated, explicitConsent} = useAuth();

    function updateArray(value:ContentRatingEnum): ContentRatingEnum[]
    {
        let arr = [...selectedValue]
        if(selectedValue.includes(value))
        {
            const index = arr.indexOf(value);
            if (index > -1) {
                arr.splice(index, 1);
            }
        }
        else
        {
            arr.push(value);
        }

        if(arr.length == 0)
        {
            arr.push(ContentRatingEnum.General)
        }

        return arr;
    }

    const toggle = async (value: ContentRatingEnum) => {
        const turningOnExplicit =
            value === ContentRatingEnum.Explicit && !selectedValue.includes(ContentRatingEnum.Explicit);

        if (turningOnExplicit && !(await requestConsent())) return;

        setReaderValue(updateArray(value));
    };

    return (
        <div className="rating-buttons inline-grid grid-cols-[repeat(3,1fr)] gap-2 h-8">
            <button
                type="button"
                onClick={() => toggle(ContentRatingEnum.General)}
                className={`text-dos flex h-8 min-w-8 px-2 border-2 justify-center items-center ${selectedValue.includes(ContentRatingEnum.General) ? "border-(--active-green) text-white bg-(--active-green)!" : "border-(--inactive-green) text-(--inactive-green)"}`}
            >
                G{ratingsCount && ` (${ratingsCount.g})`}
            </button>
            <button
                type="button"
                onClick={() => toggle(ContentRatingEnum.Questionable)}
                className={`text-dos flex h-8 min-w-8 px-2 border-2 justify-center items-center ${selectedValue.includes(ContentRatingEnum.Questionable) ? "border-(--active-yellow) text-white bg-(--active-yellow)!" : "border-(--inactive-yellow) text-(--inactive-yellow)"}`}
            >
                Q{ratingsCount && ` (${ratingsCount.q})`}
            </button>
            <button
                type="button"
                disabled={!isAuthenticated}
                onClick={() => toggle(ContentRatingEnum.Explicit)}
                className={`text-dos flex h-8 min-w-8 px-2 border-2 justify-center items-center ${!isAuthenticated && "opacity-50"} ${selectedValue.includes(ContentRatingEnum.Explicit) && explicitConsent ? "border-(--active-red) text-white bg-(--active-red)!" : "border-(--inactive-red) text-(--inactive-red)"}`}
            >
                E{ratingsCount && ` (${ratingsCount.e})`}
            </button>
        </div>
    );
}