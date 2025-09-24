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
      odds: "37%",
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

  // New markets (including single-event markets)
  const chancellorResign = [
    {
      name: "Chancellor will step down by 31 Dec 2025",
      odds: "8%",
      onYesClick: () => console.log("User bet Chancellor resign: yes"),
      onNoClick: () => console.log("User bet Chancellor resign: no")
    }
  ];

  const rainTomorrow = [
    {
      name: "Rain in Sydney tomorrow (any measurable)",
      odds: "44%",
      onYesClick: () => console.log("User bet rain tomorrow: yes"),
      onNoClick: () => console.log("User bet rain tomorrow: no")
    }
  ];

  const tramCompletion = [
    {
      name: "On schedule (complete by end of 2026)",
      odds: "28%",
      onYesClick: () => console.log("User bet tram on schedule"),
      onNoClick: () => console.log("User bet tram not on schedule")
    },
    {
      name: "Delayed but complete by 2028",
      odds: "52%",
      onYesClick: () => console.log("User bet tram delayed to 2028"),
      onNoClick: () => console.log("User bet tram other")
    },
    {
      name: "Significant cancellation/changes",
      odds: "20%",
      onYesClick: () => console.log("User bet tram cancelled"),
      onNoClick: () => console.log("User bet tram other")
    }
  ];

  const localElection = [
    {
      name: "Council candidate A",
      odds: "34%",
      onYesClick: () => console.log("User bet on candidate A"),
      onNoClick: () => console.log("User bet against candidate A")
    },
    {
      name: "Council candidate B",
      odds: "29%",
      onYesClick: () => console.log("User bet on candidate B"),
      onNoClick: () => console.log("User bet against candidate B")
    },
    {
      name: "Other",
      odds: "37%",
      onYesClick: () => console.log("User bet on other"),
      onNoClick: () => console.log("User bet against other")
    }
  ];

  return (
    <div className="App">
      <Header />
      {/* <Login /> */}
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

          {/* new markets */}
          <Market
            marketName="Will the Chancellor resign in 2025?"
            events={chancellorResign}
            volume="$1,120"
          />

          <Market
            marketName="Chance of rain tomorrow in Sydney"
            events={rainTomorrow}
            volume="$920"
          />

          <Market
            marketName="Light rail completion scenario"
            events={tramCompletion}
            volume="$3,400"
          />

          <Market
            marketName="Local council result — North Ward"
            events={localElection}
            volume="$2,050"
          />
        </div>
      </main>
    </div>
  );
}

export default App;
