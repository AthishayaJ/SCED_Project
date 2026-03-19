import axios from 'axios';

// This is the "Address" of your friend's waiter (Backend)
const API = axios.create({
    baseURL: 'http://localhost:5000/api', 
});

// This function sends a request to get the Tasks from the Database
export const getTasksFromDB = () => API.get('/tasks');

export default API;