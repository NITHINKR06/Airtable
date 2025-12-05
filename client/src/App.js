import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FormBuilder from './components/FormBuilder';
import FormViewer from './components/FormViewer';
import ResponsesList from './components/ResponsesList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forms/new" element={<FormBuilder />} />
          <Route path="/forms/:formId/edit" element={<FormBuilder />} />
          <Route path="/form/:formId" element={<FormViewer />} />
          <Route path="/forms/:formId/responses" element={<ResponsesList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

