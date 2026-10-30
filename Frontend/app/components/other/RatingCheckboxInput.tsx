import {type ChangeEvent, useState} from 'react';
import ContentRatingEnum from "~/models/enums/ContentRatingEnum";

export default function RatingCheckboxInput({setReaderValue, ratingsCount, oldValue, } : {setReaderValue: (value:ContentRatingEnum[]) => void, ratingsCount?: {g:number, q:number, e:number}, oldValue?:ContentRatingEnum[]}) {

    const [selectedValue, setSelectedValue] = useState<ContentRatingEnum[]>(oldValue ?? [ContentRatingEnum.General]);

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

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        let newArray = updateArray(parseInt(event.target.value))
        setSelectedValue(newArray);
        setReaderValue(newArray);
    };

    return (
        <div className="inline-grid grid-cols-[repeat(3,1fr)] gap-2 h-8">
            <label className={`text-dos flex h-8 min-w-8 px-2 border-2 justify-center items-center ${selectedValue.includes(ContentRatingEnum.General) ? "border-(--active-green) text-white bg-(--active-green)" : "border-(--inactive-green) text-(--inactive-green)" }`} htmlFor="check_G">
                <div>G{ratingsCount && ` (${ratingsCount.g})`}</div>
                <input
                    id="check_G"
                    className="hidden"
                    type="checkbox"
                    value={ContentRatingEnum.General}
                    onChange={handleChange} />
            </label>
            <label className={`text-dos flex h-8 min-w-8 px-2 border-2 justify-center items-center ${selectedValue.includes(ContentRatingEnum.Questionable) ? "border-(--active-yellow) text-white bg-(--active-yellow)" : "border-(--inactive-yellow) text-(--inactive-yellow)" }`} htmlFor="check_Q">
                <div>Q{ratingsCount && ` (${ratingsCount.q})`}</div>
                <input
                    id="check_Q"
                    className="hidden"
                    type="checkbox"
                    value={ContentRatingEnum.Questionable}
                    onChange={handleChange} />
            </label>
            <label className={`text-dos flex h-8 min-w-8 px-2 border-2 justify-center items-center ${selectedValue.includes(ContentRatingEnum.Explicit)  ? "border-(--active-red) text-white bg-(--active-red)" : "border-(--inactive-red) text-(--inactive-red)" }`} htmlFor="check_E">
                <div>E{ratingsCount && ` (${ratingsCount.e})`}</div>
                <input
                    id="check_E"
                    className="hidden"
                    type="checkbox"
                    value={ContentRatingEnum.Explicit}
                    onChange={handleChange} />
            </label>
            <br />

        </div>
    );
}