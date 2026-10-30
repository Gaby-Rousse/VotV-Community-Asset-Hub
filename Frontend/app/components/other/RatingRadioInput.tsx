import {type ChangeEvent, useState} from 'react';
import ContentRatingEnum from "~/models/enums/ContentRatingEnum";

export default function RatingRadioInput({setReaderValue, oldValue} : {setReaderValue: (value:ContentRatingEnum) => void, oldValue?:ContentRatingEnum}) {

    const [selectedValue, setSelectedValue] = useState<ContentRatingEnum>(oldValue ?? ContentRatingEnum.General);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSelectedValue(parseInt(event.target.value));
        setReaderValue(parseInt(event.target.value));
    };

    return (
        <div className="flex gap-2 flex-row">
            <label className={`text-dos flex size-8 border-2 justify-center items-center ${selectedValue == ContentRatingEnum.General ? "border-(--active-green) text-white bg-(--active-green)" : "border-(--inactive-green) text-(--inactive-green)" }`} htmlFor="G">
                <div>G</div>
                <input
                    id="G"
                    className="hidden"
                    type="radio"
                    name="rating"
                    value={ContentRatingEnum.General}
                    onChange={handleChange} />
            </label>
            <label className={`text-dos flex size-8 border-2 justify-center items-center ${selectedValue == ContentRatingEnum.Questionable ? "border-(--active-yellow) text-white bg-(--active-yellow)" : "border-(--inactive-yellow) text-(--inactive-yellow)" }`} htmlFor="Q">
                <div>Q</div>
                <input
                    id="Q"
                    className="hidden"
                    type="radio"
                    name="rating"
                    value={ContentRatingEnum.Questionable}
                    onChange={handleChange} />
            </label>
            <label className={`text-dos flex size-8 border-2 justify-center items-center ${selectedValue == ContentRatingEnum.Explicit ? "border-(--active-red) text-white bg-(--active-red)" : "border-(--inactive-red) text-(--inactive-red)" }`} htmlFor="E">
                <div>E</div>
                <input
                    id="E"
                    className="hidden"
                    type="radio"
                    name="rating"
                    value={ContentRatingEnum.Explicit}
                    onChange={handleChange} />
            </label>
            <br />

        </div>
    );
}