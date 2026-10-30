import {type ChangeEvent, useEffect, useState} from 'react';
import ContentRatingEnum from "~/models/enums/ContentRatingEnum";
import {useConsent} from "~/context/ConsentContext";

export default function RatingRadioInput({setReaderValue, oldValue} : {setReaderValue: (value:ContentRatingEnum) => void, oldValue?:ContentRatingEnum}) {

    const requestConsent = useConsent();

    const [selectedValue, setSelectedValue] = useState<ContentRatingEnum>(oldValue ?? ContentRatingEnum.General);

    const select = async (value: ContentRatingEnum) => {
        if (value === ContentRatingEnum.Explicit
            && selectedValue !== ContentRatingEnum.Explicit
            && !(await requestConsent())) return;

        setSelectedValue(value);
        setReaderValue(value);
    };

    useEffect(() => {
        if (oldValue !== undefined) setSelectedValue(oldValue);
    }, [oldValue]);

    return (
        <div className="rating-buttons flex gap-2 flex-row">
            <button
                type="button"
                onClick={() => select(ContentRatingEnum.General)}
                className={`text-dos flex size-8 border-2 justify-center items-center ${selectedValue == ContentRatingEnum.General ? "border-(--active-green) text-white bg-(--active-green)" : "border-(--inactive-green) text-(--inactive-green)"}`}
            >
                G
            </button>
            <button
                type="button"
                onClick={() => select(ContentRatingEnum.Questionable)}
                className={`text-dos flex size-8 border-2 justify-center items-center ${selectedValue == ContentRatingEnum.Questionable ? "border-(--active-yellow) text-white bg-(--active-yellow)" : "border-(--inactive-yellow) text-(--inactive-yellow)"}`}
            >
                Q
            </button>
            <button
                type="button"
                onClick={() => select(ContentRatingEnum.Explicit)}
                className={`text-dos flex size-8 border-2 justify-center items-center ${selectedValue == ContentRatingEnum.Explicit ? "border-(--active-red) text-white bg-(--active-red)" : "border-(--inactive-red) text-(--inactive-red)"}`}
            >
                E
            </button>
        </div>
    );
}