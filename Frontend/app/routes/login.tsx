import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router";
import {apiCall} from "~/routes/functions";
import {useAuth} from "~/context/AuthContext";

export default function login() {
    const [visibleCount, setVisibleCount] = useState(0);
    const [previousValue, setPreviousValue] = useState({username: ""});
    const [error, setError] = useState("");
    //https://reactrouter.com/start/declarative/navigating#usenavigate
    const navigate = useNavigate();
    const numberOfLines: number = 5;
    const {isAuthenticated, refreshAuth} = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/account");
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (visibleCount < numberOfLines) {
            const timer = setTimeout(() => {
                setVisibleCount(prev => prev + 1);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [visibleCount]);

    //https://react.dev/reference/react-dom/components/form
    async function handleSubmit(formData: FormData) {

        let username = formData.get("username")?.toString() ?? "";
        setPreviousValue({...previousValue, username: username})


        let response = await apiCall("http://10.0.0.131:5130/api/Accounts/login", formData);
        if (response.ok) {
            navigate("/");
            refreshAuth();
        } else {
            setError("Username or password invalid.");
        }
    }

    return (
        <>
            <form action={handleSubmit}
                  className="bg-black flex h-screen w-screen">
                <div className="ml-1 mt-auto flex flex-col">
                    <Line visibleCount={visibleCount} requiredCount={1}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Welcome. Please authenticate.</div>
                        </div>
                    </Line>
                    {error != "" ? (<Line visibleCount={visibleCount} requiredCount={2}>
                        <div className="flex flex-row gap-1">
                            <div className="dos red">{error}</div>
                        </div>
                    </Line>) : ("")}
                    <Line visibleCount={visibleCount} requiredCount={2}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Username:</div>
                            <input name="username" defaultValue={previousValue.username} type="text" className="dos"/>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={3}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Password:</div>
                            <input name="password" type="password" className="dos"/>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={4}>
                        <Link className="dos url" to="/register">Need an account? Click here to register</Link>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={5}>
                        <button type="submit" className="dos url w-4 sm:hidden">Submit!</button>
                    </Line>

                </div>

            </form>

        </>
    );
}

export function Line({visibleCount, requiredCount, children}: {
    visibleCount: number,
    requiredCount: number,
    children: any
}) {
    return (
        visibleCount >= requiredCount ? (children) : ('')
    )
}

