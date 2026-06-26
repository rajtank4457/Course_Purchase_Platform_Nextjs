import axios from "axios";
import API_URL from "@/config/api";

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized or session expired");
    }

    return Promise.reject(error);
  }
);

export default axiosClient;