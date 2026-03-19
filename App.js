import React, { useEffect, useState } from 'react';
import { getTasksFromDB } from './services/api';

function App() {
  const [tasks, setTasks] = useState([]); 
  const [loading, setLoading] = useState(true); // Step 1: Start with Loading = true
  const [error, setError] = useState(null);    // Step 2: A place to store errors

  useEffect(() => {
    getTasksFromDB()
      .then(response => {
        setTasks(response.data);
        setLoading(false); // Data arrived! Stop loading.
      })
      .catch(err => {
        console.log("Waiting for backend...");
        setError("Could not connect to the campus server."); // Plan B
        setLoading(false); // Stop loading so we can show the error
      });
  }, []);

  // --- UI LOGIC ---

  // 1. If still loading, show this:
  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <div className="loader"></div> 
        <p>Connecting to Smart Campus Database...</p>
      </div>
    );
  }

  // 2. If finished loading but there is an error, show this:
  if (error && tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: 'orange' }}>
        <h1>Smart Campus Dashboard</h1>
        <p>⚠️ {error}</p>
        <p>Make sure your friend's Backend is running on Port 5000!</p>
      </div>
    );
  }

  // 3. If everything is perfect, show the data:
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1 style={{ color: '#2c3e50' }}>Smart Campus Dashboard</h1>
      <div style={{ border: '1px solid #ddd', padding: '20px', display: 'inline-block', borderRadius: '10px' }}>
        <h3>My Tasks from MySQL:</h3>
        {tasks.map(t => (
          <p key={t.id} style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
            ✅ {t.task_name}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;