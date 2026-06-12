import axios from 'axios';

// Base API instance
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token && !token.startsWith("local-")) {
        req.headers.Authorization = `Bearer ${token}`;
    } else if (token && token.startsWith("local-")) {
        localStorage.removeItem("token");
    }
    return req;
});

export const loginUser = (credentials) => API.post('/api/auth/login', credentials);
export const signupUser = (credentials) => API.post('/api/auth/signup', credentials);

export const getTodos = () => API.get("/api/todos");
export const createTodo = (todoData) => API.post('/api/todos', todoData);
export const updateTodo = (todoId, todoData) => API.put(`/api/todos/${todoId}`, todoData);
export const deleteTodo = (todoId) => API.delete(`/api/todos/${todoId}`);

export default API;
