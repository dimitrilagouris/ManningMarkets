import React from 'react';
import Header from './base/header';
import Login from './login/login';
import Market from './markets/markets';
import './App.css';

function App() {
  const presidentialPrediction = [
    {
      name: "Dimitri Lagouris",
      odds: "67%",
      onYesClick: () => console.log("User bet on Lago"),
      onNoClick: () => console.log("User bet against Lago")
    },
    {
      name: "Sean Combs",
      odds: "20%",
      onYesClick: () => console.log("User bet on Diddy"),
      onNoClick: () => console.log("User bet against Diddy")
    },
    {
      name: "Other",
      odds: "13%",
      onYesClick: () => console.log("User bet on Other"),
      onNoClick: () => console.log("User bet against Other")
    }
  ];

  const busRouteExpansion = [
    {
      name: "The 428 will extend to the new Westmead Campus",
      odds: "15%",
      onYesClick: () => console.log("User bet on 428 expansion"),
      onNoClick: () => console.log("User bet against 428 expansion")
    },
    {
      name: "A new express shuttle will be introduced",
      odds: "37%x",
      onYesClick: () => console.log("User bet on new shuttle"),
      onNoClick: () => console.log("User bet against new shuttle")
    },
    {
      name: "No changes to bus routes",
      odds: "48%",
      onYesClick: () => console.log("User bet on no changes"),
      onNoClick: () => console.log("User bet against no changes")
    }
  ];

  const grandFinalWinner = [
    {
      name: "Sydney University Football Club",
      odds: "61%",
      onYesClick: () => console.log("User bet on SUFC"),
      onNoClick: () => console.log("User bet against SUFC")
    },
    {
      name: "Eastwood Rugby Club",
      odds: "17%",
      onYesClick: () => console.log("User bet on Eastwood"),
      onNoClick: () => console.log("User bet against Eastwood")
    },
    {
      name: "Other",
      odds: "22%",
      onYesClick: () => console.log("User bet on Other team"),
      onNoClick: () => console.log("User bet against Other team")
    }
  ];

  return (
    <div className="App">
      <Header />
        {/*<Login />*/}
      <main className="main-content">
        <div className="markets-container">
          <Market
            marketName="Who will be elected USU President?"
            events={presidentialPrediction}
            volume="$12,840"
          />

          <Market
            marketName="How will transport to the new campus be solved?"
            events={busRouteExpansion}
            volume="$5,210"
          />

          <Market
            marketName="Who will win the next inter-varsity grand final?"
            events={grandFinalWinner}
            volume="$7,690"
          />
        </div>
      </main>
    </div>
  );
}

export default App;