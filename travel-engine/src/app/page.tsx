"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

type Activity = {
  time: string;
  activity: string;
  cost: string;
  reason: string;
};

// Use the API key directly on the client for the hackathon MVP to bypass local Windows SWC/Node bugs
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyBeUS2vE8LrawkwRe90uszGYUaKe0dVqZY";

export default function Home() {
  const [destination, setDestination] = useState("Tokyo, Japan");
  const [budget, setBudget] = useState("$500");
  const [vibe, setVibe] = useState("Hidden gems, low walking, chill");
  
  const [itinerary, setItinerary] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [disruptionEvent, setDisruptionEvent] = useState("Heavy Rain at 2 PM");
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "trips", "demo-trip"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.itinerary) setItinerary(data.itinerary);
        if (data.logs) setLogs(data.logs);
      }
    });
    return () => unsub();
  }, []);

  const callGemini = async (prompt: string) => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to generate");
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  const generateTrip = async () => {
    setLoading(true);
    const initialLogs = ["System: Initializing multi-agent planner..."];
    setLogs(initialLogs);
    
    try {
      const prompt = `
      You are an expert travel operations AI. Create an innovative day trip itinerary.
      Destination: ${destination}
      Budget: ${budget}
      Vibe/Preferences: ${vibe}
      
      Prioritize user comfort, budget efficiency, experience uniqueness, and minimum transit.
      
      Respond STRICTLY in this JSON format:
      {
        "logs": [
           "Preference Agent analyzing user interests...",
           "Route Agent optimizing transit...",
           "Budget Agent allocating funds..."
        ],
        "itinerary": [
          { "time": "9:00 AM", "activity": "Activity name", "cost": "$10", "reason": "Why chosen" }
        ]
      }
      `;
      
      const data = await callGemini(prompt);
      
      await setDoc(doc(db, "trips", "demo-trip"), {
        itinerary: data.itinerary,
        logs: [...initialLogs, ...data.logs, "System: Plan generation complete."]
      });
      
    } catch (e: any) {
      console.error(e);
      setLogs(["System ERROR: " + (e.message || "Failed to reach AI endpoint.")]);
    }
    setLoading(false);
  };

  const simulateDisruption = async () => {
    setLoading(true);
    const newLogs = [...logs, "🚨 DISRUPTION DETECTED: " + disruptionEvent, "System: Activating Dynamic Replanning Agent..."];
    
    await setDoc(doc(db, "trips", "demo-trip"), { itinerary, logs: newLogs });
    
    try {
      const prompt = `
      You are an expert travel operations AI. A disruption has occurred!
      Disruption: ${disruptionEvent}
      Current Itinerary: ${JSON.stringify(itinerary)}
      
      Your task is to REPLAN the itinerary to accommodate this disruption. 
      Keep unaffected items. Replace ruined items with indoor/suitable alternatives within the same budget and area.
      Explain WHY the change was made in the 'reason' field.
      
      Respond STRICTLY in this JSON format:
      {
        "logs": ["Weather agent detected rain", "Replanning agent finding indoor cafes"],
        "itinerary": [
          { "time": "9:00 AM", "activity": "Activity name", "cost": "$10", "reason": "Why chosen" }
        ]
      }
      `;
      
      const data = await callGemini(prompt);
      
      await setDoc(doc(db, "trips", "demo-trip"), {
        itinerary: data.itinerary,
        logs: [...newLogs, ...data.logs, "✅ System: Itinerary successfully adapted."]
      });
      
    } catch (e: any) {
      console.error(e);
      setLogs(prev => [...prev, "System ERROR: Re-planning failed: " + e.message]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Adaptive Travel Copilot
          </h1>
          <p className="text-neutral-400 text-sm">Multi-Agent Travel Intelligence System</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[80vh]">
          
          {/* LEFT PANEL: Input */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
            <h2 className="text-xl font-semibold mb-2">Trip Preferences</h2>
            
            <div>
              <label className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Destination</label>
              <input 
                type="text" 
                value={destination} 
                onChange={e => setDestination(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Budget</label>
              <input 
                type="text" 
                value={budget} 
                onChange={e => setBudget(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Vibe & Constraints</label>
              <textarea 
                value={vibe} 
                onChange={e => setVibe(e.target.value)}
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button 
              onClick={generateTrip} 
              disabled={loading}
              className="mt-auto bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Orchestrating..." : "Generate Smart Itinerary"}
            </button>
          </div>

          {/* CENTER PANEL: Timeline */}
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col shadow-xl overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Live Itinerary</h2>
              
              {/* THE "WOW" BUTTON */}
              {itinerary.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="flex items-center gap-2"
                >
                  <input 
                    type="text" 
                    value={disruptionEvent} 
                    onChange={e => setDisruptionEvent(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1 text-sm w-40 focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <button 
                    onClick={simulateDisruption}
                    disabled={loading}
                    className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    ⚡ Simulate Disruption
                  </button>
                </motion.div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <AnimatePresence mode="popLayout">
                {itinerary.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="h-full flex items-center justify-center text-neutral-500 text-sm italic"
                  >
                    Awaiting generation...
                  </motion.div>
                ) : (
                  itinerary.map((item, i) => (
                    <motion.div 
                      key={item.activity + i} 
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, delay: i * 0.1, type: "spring" }}
                      className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex gap-4 transition-all duration-300 ease-in-out hover:border-blue-500/50 group"
                    >
                      <div className="text-emerald-400 font-mono text-sm pt-1 w-20 shrink-0">
                        {item.time}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{item.activity}</h3>
                        <div className="flex items-center gap-3 text-xs mb-2">
                          <span className="bg-neutral-800 px-2 py-1 rounded text-neutral-300">{item.cost}</span>
                        </div>
                        <p className="text-neutral-400 text-sm border-l-2 border-blue-500/30 pl-3">
                          <span className="text-blue-400 text-xs uppercase font-bold tracking-wider mr-2">AI Reason:</span>
                          {item.reason}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
            
            {/* Loading Overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-10"
                >
                  <div className="bg-neutral-950 border border-neutral-800 px-6 py-4 rounded-full flex items-center gap-3 shadow-2xl">
                    <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="font-mono text-sm text-blue-400">Agents processing data...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT PANEL: Agent Feed */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Agent Feed
            </h2>
            
            <div className="flex-1 overflow-y-auto bg-neutral-950 rounded-xl border border-neutral-800 p-4 font-mono text-xs space-y-3 flex flex-col justify-end">
              <AnimatePresence>
                {logs.length === 0 ? (
                  <div className="text-neutral-600">No agent activity.</div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div 
                      key={i + log} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`pb-2 border-b border-neutral-800/50 last:border-0 ${log.includes('🚨') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : 'text-neutral-300'}`}
                    >
                      <span className="text-neutral-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                      {log}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
