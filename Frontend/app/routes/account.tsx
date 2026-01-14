import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import {apiCall} from "~/tsx/functions";
import {Line} from "./login";
import {useAuth} from "~/context/AuthContext";

export default function account() {
    const [visibleCount, setVisibleCount] = useState(0);
    //https://reactrouter.com/start/declarative/navigating#usenavigate
    const navigate = useNavigate();
    const {isAuthenticated, username, refreshAuth} = useAuth();
    const numberOfLines: number = 5;

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
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
        e.preventDefault()

        let formData = new FormData(e.currentTarget);
        let option = parseInt(formData.get("Option")?.toString() ?? "")

        if (option == 1) {
            let response = await apiCall("http://10.0.0.131:5130/api/Accounts/logout", null);
            if (response.ok) {
                navigate("/");
                refreshAuth();
            } else {
            }
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit}
                  className="bg-black flex h-screen w-screen">
                <div className="ml-1 mt-auto flex flex-col">
                    <Line visibleCount={visibleCount} requiredCount={1}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Hello {username}.
                            </div>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={2}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">You can adjust your account settings here.
                            </div>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={3}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">1) Log off</div>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={4}>
                        <div className="flex flex-row gap-1">
                            <div className="dos">Please select an option:</div>
                            <input name="Option" className="dos"/>
                        </div>
                    </Line>
                    <Line visibleCount={visibleCount} requiredCount={5}>
                        <button type="submit" className="dos url w-4 sm:hidden">Submit!</button>
                    </Line>
                </div>

            </form>

        </>
    );
}


