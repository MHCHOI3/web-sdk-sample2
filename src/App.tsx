import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Pen from './component/Pen';
import Render from './component/Render';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/2' element={<Pen />} />
        <Route path='/' element={<Render />} />
      </Routes>
    </div>
  );
};

export default App;
