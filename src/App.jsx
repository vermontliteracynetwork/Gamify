import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import PlinkOhGame from './games/plink-oh/PlinkOhGame';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/plink-oh" element={<PlinkOhGame />} />
      </Routes>
    </BrowserRouter>
  );
}
