import React, {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router";
import {apiCall} from "~/routes/functions";
import {useAuth} from "~/context/AuthContext";

export default function login() {
    const [visibleCount, setVisibleCount] = useState(0);
    const [previousValue, setPreviousValue] = useState({username: ""});
    const [error, setError] = useState("");
    //https://reactrouter.com/start/declarative/navigating#usenavigate
    const navigate = useNavigate();
    const numberOfLines: number = 7;
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
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        let formData = new FormData(e.currentTarget);

        let username = formData.get("username")?.toString() ?? "";
        setPreviousValue({...previousValue, username: username})


        let response = await apiCall("http://10.0.0.131:5130/api/Accounts/register", formData);
        if (response.ok) {
            navigate("/login");
            refreshAuth();
        } else {
            let error = await response.json();
            console.log(error.detail)
            setError(error.detail);
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit}
                  className="bg-black flex h-screen w-screen">
                <div className="ml-1 mt-auto flex flex-col">
                    <Line visibleCount={visibleCount} requiredCount={1}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Welcome new user.</div>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={2}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Enter the username and the password you wish to use.</div>
                        </div>
                    </Line>
                    {error != "" ? (<Line visibleCount={visibleCount} requiredCount={3}>
                        <div className="flex flex-row gap-1">
                            <div className="dos red">{error}</div>
                        </div>
                    </Line>) : ("")}
                    <Line visibleCount={visibleCount} requiredCount={3}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Username:</div>
                            <input name="username" defaultValue={previousValue.username} type="text" className="dos"/>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={4}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Password:</div>
                            <input name="password" type="password" className="dos"/>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={5}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Password confirmation:</div>
                            <input name="confirmPassword" type="password" className="dos"/>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={6}>
                        <div>
                            <Link className="dos url" to="/login">Already have an account? Click here to login</Link>
                        </div>


                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={7}>
                        <button type="submit" className="dos url w-4 sm:hidden">Submit!</button>
                    </Line>
                </div>
                <input hidden name="email" type="email" className="dos"/>
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

