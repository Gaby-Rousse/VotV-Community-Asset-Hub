
import {useState} from "react";
import RatingRadioInput from "~/components/other/RatingRadioInput";
import RatingCheckboxInput from "~/components/other/RatingCheckboxInput";


export default function dev()
{

    const [value, setValue] = useState(0);

    return (<>
        <div className="h-screen w-screen p-8 bg-black flex flex-col gap-4">
            <div>Radio</div>
            <RatingRadioInput setReaderValue={setValue}/>
            <div>Checkbox</div>
            <RatingCheckboxInput setReaderValue={setValue}/>
        </div>
    </>)
}