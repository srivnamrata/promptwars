"use client";

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';

// Use the API key directly on the client for the hackathon MVP to bypass local Windows SWC/Node bugs
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyBeUS2vE8LrawkwRe90uszGYUaKe0dVqZY";
const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY || ""; // Transparent failure if missing for hackathon

type Activity = {
  time: string;
  activity: string;
  cost: string;
  reason: string;
  lat: number;
  lng: number;
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
};

const defaultCenter = { lat: 35.6762, lng: 139.6503 }; // Tokyo

export default function Home() {
  const [destination, setDestination] = useState("Tokyo, Japan");
  const [budget, setBudget] = useState("$500");
  const [vibe, setVibe] = useState("Hidden gems, low walking, chill");
  
  const [itinerary, setItinerary] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [disruption, setDisruption] = useState("");

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: MAPS_API_KEY,
  });

  const [map, setMap] = useState<any>(null);

  const onLoad = useCallback(function callback(map: any) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  const callGemini = async (prompt: string) => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
    setLogs(["System: Initializing Google AI Planner...", "System: Generating coordinate matrices..."]);
    
    try {
      const prompt = `
      You are an expert travel operations AI. Create an innovative day trip itinerary.
      Destination: ${destination}
      Budget: ${budget}
      Vibe/Preferences: ${vibe}
      
      Respond STRICTLY in this JSON format:
      {
        "logs": ["Agent analyzed interests", "Agent optimized route"],
        "itinerary": [
          { "time": "9:00 AM", "activity": "Activity name", "cost": "$10", "reason": "Why chosen", "lat": 35.6762, "lng": 139.6503 }
        ]
      }
      `;
      
      const data = await callGemini(prompt);
      setItinerary(data.itinerary);
      setLogs(prev => [...prev, ...data.logs, "✅ System: Plan generation complete."]);
      
      if (map && data.itinerary.length > 0 && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        data.itinerary.forEach((item: Activity) => {
          bounds.extend({ lat: item.lat, lng: item.lng });
        });
        map.fitBounds(bounds);
      }
    } catch (e: any) {
      setLogs(["System ERROR: " + (e.message || "Failed to reach AI endpoint.")]);
    }
    setLoading(false);
  };

  const simulateDisruption = async () => {
    if (!disruption) return;
    setLoading(true);
    setLogs(prev => [...prev, `🚨 DISRUPTION: ${disruption}`, "System: Activating Dynamic Replanning..."]);
    
    try {
      const prompt = `
      A disruption occurred! Disruption: ${disruption}
      Current Itinerary: ${JSON.stringify(itinerary)}
      
      REPLAN the itinerary. Replace affected items with suitable alternatives nearby.
      Respond STRICTLY in this JSON format:
      {
        "logs": ["Weather agent detected issue", "Replanning complete"],
        "itinerary": [
          { "time": "9:00 AM", "activity": "Activity name", "cost": "$10", "reason": "Why changed", "lat": 35.6762, "lng": 139.6503 }
        ]
      }
      `;
      
      const data = await callGemini(prompt);
      setItinerary(data.itinerary);
      setLogs(prev => [...prev, ...data.logs, "✅ System: Itinerary successfully adapted."]);
      
      if (map && data.itinerary.length > 0 && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        data.itinerary.forEach((item: Activity) => {
          bounds.extend({ lat: item.lat, lng: item.lng });
        });
        map.fitBounds(bounds);
      }
    } catch (e: any) {
      setLogs(prev => [...prev, "System ERROR: Re-planning failed: " + e.message]);
    }
    setLoading(false);
  };

  const pathCoords = itinerary.map(item => ({ lat: item.lat, lng: item.lng }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 p-4 md:p-8 flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto h-[90vh] flex flex-col">
        
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Sparkles className="text-indigo-400 w-8 h-8" />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                GeoSmart Travel Engine
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium ml-11">Powered by Google Gemini & Maps</p>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* LEFT: Controls & Timeline */}
          <div className="lg:col-span-5 flex flex-col gap-6 overflow-hidden">
            
            {/* Input Form */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-2xl shrink-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1.5 block">Destination</label>
                    <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1.5 block">Budget</label>
                    <input type="text" value={budget} onChange={e => setBudget(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1.5 block">Vibe & Preferences</label>
                  <input type="text" value={vibe} onChange={e => setVibe(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                </div>
                <button onClick={generateTrip} disabled={loading}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all flex justify-center items-center gap-2">
                  {loading ? <><Loader2 className="animate-spin w-5 h-5" /> Optimizing Route...</> : <><Navigation className="w-5 h-5" /> Generate Geo-Itinerary</>}
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 flex-1 overflow-hidden flex flex-col relative">
              
              <div className="flex justify-between items-end mb-4 shrink-0">
                <h2 className="text-lg font-bold">Dynamic Itinerary</h2>
                {itinerary.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                    <input type="text" placeholder="e.g. Heavy Rain" value={disruption} onChange={e => setDisruption(e.target.value)}
                      className="bg-slate-950 border border-red-900/50 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-1 focus:ring-red-500 outline-none placeholder:text-red-900/40" />
                    <button onClick={simulateDisruption} disabled={loading || !disruption}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                      <AlertTriangle className="w-4 h-4" /> Disrupt
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                <AnimatePresence mode="popLayout">
                  {itinerary.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-slate-500 italic space-y-4">
                      <MapPin className="w-12 h-12 text-slate-800" />
                      <p>Awaiting destination parameters...</p>
                    </motion.div>
                  ) : (
                    itinerary.map((item, i) => (
                      <motion.div key={i + item.activity} layout
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl flex gap-4 hover:border-indigo-500/30 transition-colors relative overflow-hidden group">
                        
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="text-indigo-400 font-mono text-sm pt-0.5 w-16 shrink-0 font-bold">{item.time}</div>
                        <div>
                          <h3 className="font-bold text-slate-100 mb-1">{item.activity}</h3>
                          <div className="flex gap-2 text-xs mb-2">
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">{item.cost}</span>
                          </div>
                          <p className="text-slate-400 text-sm leading-snug">{item.reason}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* RIGHT: Visual Map & Logs */}
          <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden">
            
            {/* The Google Map */}
            <div className="bg-slate-900 border border-slate-800/60 rounded-3xl p-2 h-2/3 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-6 left-6 z-10 bg-slate-950/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-800 shadow-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Live Telemetry</span>
              </div>
              
              {isLoaded ? (
                <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={12} onLoad={onLoad} onUnmount={onUnmount}
                  options={{ styles: mapStyles, disableDefaultUI: true, zoomControl: true }}>
                  {itinerary.map((item, i) => (
                    <Marker key={i} position={{ lat: item.lat, lng: item.lng }} 
                      icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#6366f1', fillOpacity: 1, strokeWeight: 2, strokeColor: '#ffffff' }} />
                  ))}
                  {pathCoords.length > 1 && (
                    <Polyline path={pathCoords} options={{ strokeColor: '#8b5cf6', strokeOpacity: 0.8, strokeWeight: 4, geodesic: true }} />
                  )}
                </GoogleMap>
              ) : (
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-slate-500 font-mono text-sm border border-slate-800/50">
                  {loadError ? "MAPS_API_KEY Missing (Developer Mode Active)" : "Initializing Google Maps Platform..."}
                </div>
              )}
            </div>

            {/* Agent Terminal */}
            <div className="bg-black/80 border border-slate-800/80 rounded-3xl p-5 flex-1 shadow-2xl font-mono text-xs overflow-hidden flex flex-col">
              <div className="text-slate-500 mb-3 border-b border-slate-800 pb-2 uppercase tracking-widest font-bold flex justify-between">
                <span>System Logs</span>
                <span>v2.0.0</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 flex flex-col justify-end">
                <AnimatePresence>
                  {logs.map((log, i) => (
                    <motion.div key={i + log} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className={`
                        ${log.includes('🚨') ? 'text-red-400' : 
                          log.includes('✅') ? 'text-emerald-400' : 
                          'text-slate-300'}
                      `}>
                      <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                      {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#020617" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#020617" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#020617" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
];
