import axios from 'axios';

// Base API instance
const API = axios.create({
    baseURL: 'http://localhost:5000'
});

// 🔐 Add interceptor to attach token automatically
API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token && !token.startsWith("local-")) {
        req.headers.Authorization = `Bearer ${token}`;
    } else if (token && token.startsWith("local-")) {
        localStorage.removeItem("token");
    }
    return req;
});

// Auth endpoints
export const loginUser = (credentials) => API.post('/api/auth/login', credentials);
export const signupUser = (credentials) => API.post('/api/auth/signup', credentials);

// Todos endpoints
export const getTodos = () => API.get("/api/todos");
export const createTodo = (todoData) => API.post('/api/todos', todoData);
export const updateTodo = (todoId, todoData) => API.put(`/api/todos/${todoId}`, todoData);
export const deleteTodo = (todoId) => API.delete(`/api/todos/${todoId}`);

export default API;
