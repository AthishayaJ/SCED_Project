import axios from 'axios';

// Base API instance
const API = axios.create({
    baseURL: 'http://localhost:5000/api' // just /api, not /todos
});

// 🔐 Add interceptor to attach token automatically
API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

// Auth endpoints
export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const signupUser = (credentials) => API.post('/auth/signup', credentials);

// Todos endpoints
export const getTodos = () => API.get('/todos');
export const createTodo = (todoData) => API.post('/todos', todoData);

export default API;
