import {createContext, useContext, useEffect, useState} from 'react';
import {apiCall} from "~/components/Functions";

const AuthContext = createContext({
    isAuthenticated: false,
    username: "",
    refreshAuth: () => {
    },
    id: "",
    isAdmin: false,
    explicitConsent: false,
});

export const AuthProvider = ({children}: any) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("")
    const [id, setId] = useState("")
    const [isAdmin, setIsAdmin] = useState(false);
    const [explicitConsent, setExplicitConsent] = useState(false);

    useEffect(() => {
        checkAuth()
    }, []);

    function checkAuth() {
        apiCall('/api/Accounts/status', null)
            .then(res => res.json())
            .then(data => {
                setIsAuthenticated(data.isAuthenticated);
                setUsername(data.username);
                setId(data.id);
                setIsAdmin(data.isAdmin || false);
                setExplicitConsent(data.explicitConsent || false);
            })
            .catch(() => {
                setIsAuthenticated(false);
                setIsAdmin(false);
            });
    }

    return (
        <AuthContext.Provider
            value={{
                id: id,
                isAdmin: isAdmin,
                isAuthenticated: isAuthenticated,
                username: username,
                refreshAuth: () => checkAuth(),
                explicitConsent: explicitConsent
            }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);