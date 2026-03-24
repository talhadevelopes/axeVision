import axios from "axios"
import { useAuthStore } from "../stores/authStore"

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
})

instance.interceptors.request.use((config) => {
  // Get token from Zustand store instead of localStorage directly
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default instance