import React from 'react';
import { useState, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Nu am putut încărca task-urile.');
        return res.json();
      })
      .then((data) => setTasks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleAdd() {
    if (!newTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: newTitle,
      status: 'pending',
    };

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Nu am putut adăuga task-ul.');
        return res.json();
      })
      .then((createdTask) => {
        setTasks((prev) => [...prev, createdTask]);
        setNewTitle('');
      })
      .catch((err) => setError(err.message));
  }

  function handleDelete(taskId) {
    fetch(`${API_URL}/${taskId}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Nu am putut șterge task-ul.');
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      })
      .catch((err) => setError(err.message));
  }

  return (
    <div className="app">
      <h1>Lista mea de task-uri</h1>

      <div className="add-row">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Titlu task nou"
        />
        <button onClick={handleAdd}>Adaugă</button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="empty">Se încarcă...</p>
      ) : tasks.length === 0 ? (
        <p className="empty">Nu ai niciun task momentan.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={`task ${task.status}`}>
              <span className="task-id">#{task.id}</span>
              <span className="task-title">{task.title}</span>
              <span className="task-status">{task.status}</span>
              <button className="delete-btn" onClick={() => handleDelete(task.id)}>
                Șterge
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
