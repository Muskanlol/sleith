import { createContext, useCallback, useState, useEffect, useContext} from "react";
import { tokenStorage } from "../api/client";
import { authApi } from "../api/auth.api";

const AuthContext = createContext(null)

export function AuthProvider({children}) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const hydrate = async () => {
            if (!tokenStorage.getAccess()) {
                setLoading(false)
                return
            }
            try {
                const {data} = await authApi.me()
                setUser(data)
            }catch {
                tokenStorage.clear()
                setUser(null)
            }finally {
                setLoading(false)
            }
        }
        hydrate()
    }, [])

    const login = useCallback(async (email, password) => {
        const {data} = await authApi.login(email, password)
        tokenStorage.set(data.access, data.refresh)
        if (data.user) {
            setUser(data.user)
            return data.user
        }
        const {data: me } = await authApi.me()
        setUser(me)
        return me
    }, [])

    const register = useCallback(async (payload) => {
        const {data} = await authApi.register(payload)
        return data

    }, [])

    const logout = useCallback(async () => {
        const refresh = tokenStorage.getRefresh()
        try {
            if (refresh) await authApi.logout(refresh)
        }catch {}
    tokenStorage.clear()
    setUser(null)
    }, [])

    const refreshProfile = useCallback(async () => {
        const {data} = await authApi.me()
        setUser(data)
        return data
    }, [])

    const value = {
         user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
    return ctx
}