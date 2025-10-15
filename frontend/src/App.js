import React from 'react';
import Header from './base/header';
import Markets from './markets/markets';
import './App.css';
import {PlacePositionPage} from "./placePosition/placePosition";

function App() {
  return (
    <div className="App">
      <Header />
      <PlacePositionPage />
    </div>
  );
}

export default App;