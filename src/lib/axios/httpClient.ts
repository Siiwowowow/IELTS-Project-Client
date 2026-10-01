//src/lib/axios/httpClient.ts
import { ApiResponse } from '@/types/api.types';
import axios from 'axios';

const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        return '/api/v1';
    }
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
};

const instance = axios.create({
    baseURL: getBaseURL(),
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Axios response interceptor 401 এরর ধরার জন্য
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or invalid, redirecting to login...");
            if (typeof window !== 'undefined') {
                window.location.href = '/login'; // লগইন পেজে পাঠিয়ে দিচ্ছে
            }
        }
        return Promise.reject(error);
    }
);

const axiosInstance = () => {
    if (typeof window !== 'undefined') {
        instance.defaults.baseURL = '/api/v1';
    }
    return instance;
};

export interface ApiRequestOptions {
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    timeout?: number;
}

const httpGet = async <TData>(endpoint: string, options?: ApiRequestOptions) : Promise<ApiResponse<TData>> => {
    try {     
        const instance = axiosInstance();   
        const response = await instance.get<ApiResponse<TData>>(endpoint, {
            params: options?.params,
            headers: options?.headers,
            timeout: options?.timeout,
        });
        return response.data;
    } catch (error: unknown) {       
        const err = error as { response?: { data?: unknown }; message?: string };
        console.error(`GET request to ${endpoint} failed:`, err?.response?.data || err.message);
        throw error;
    }
}

const httpPost = async <TData>(endpoint: string, data: unknown, options?: ApiRequestOptions) : Promise<ApiResponse<TData>> => {
    try {
        const response = await axiosInstance().post<ApiResponse<TData>>(endpoint, data, {
            params: options?.params,
            headers: options?.headers,
            timeout: options?.timeout,
        });
        return response.data;
    } catch (error) {
        console.error(`POST request to ${endpoint} failed:`, error);
        throw error;
    }
}

const httpPut = async <TData>(endpoint: string, data: unknown, options?: ApiRequestOptions) : Promise<ApiResponse<TData>> => {
    try {
        const response = await axiosInstance().put<ApiResponse<TData>>(endpoint, data, {
            params: options?.params,
            headers: options?.headers,
            timeout: options?.timeout,
        });
        return response.data;
    } catch (error) {
        console.error(`PUT request to ${endpoint} failed:`, error);
        throw error;
    }
}

const httpPatch = async <TData>(endpoint: string, data: unknown, options?: ApiRequestOptions) : Promise<ApiResponse<TData>> => {
    try {
        const response = await axiosInstance().patch<ApiResponse<TData>>(endpoint, data, {
            params: options?.params,
            headers: options?.headers,
            timeout: options?.timeout,
        });
        return response.data;
    }
    catch (error) {
        console.error(`PATCH request to ${endpoint} failed:`, error);
        throw error;
    }
}

const httpDelete =  async <TData>(endpoint: string, options?: ApiRequestOptions) : Promise<ApiResponse<TData>> => {
    try {
        const response = await axiosInstance().delete<ApiResponse<TData>>(endpoint, {
            params: options?.params,
            headers: options?.headers,
            timeout: options?.timeout,
        });
        return response.data;
    } catch (error) {
        console.error(`DELETE request to ${endpoint} failed:`, error);
        throw error;
    }
}

export const httpClient = {
    get: httpGet,
    post: httpPost,
    put: httpPut,
    patch: httpPatch,
    delete: httpDelete,
}