import axios from 'axios';
import { DJANGO_API_BASE } from '../config';

const clientApi = axios.create({
    baseURL: DJANGO_API_BASE,
    withCredentials: true,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

// Intercept every response globally
clientApi.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            window.location.replace('/login');
        }
        return Promise.reject(error);
    }
);

export default clientApi;