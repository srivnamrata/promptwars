"use client";

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { useGemini } from '@/hooks/useGemini';
import { mapStyles, mapContainerStyle, defaultCenter } from '@/config/mapConfig';
import { Activity } from '@/types';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY || ""; 

export default function Home() {
  const [destination, setDestination] = useState("Tokyo, Japan");
  const [budget, setBudget] = useState("$500");
  const [vibe, setVibe] = useState("Hidden gems, low walking, chill");
  const [disruption, setDisruption] = useState("");
  const [map, setMap] = useState<any>(null);

  const { itinerary, logs, loading, generateTrip, simulateDisruption } = useGemini();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: MAPS_API_KEY,
  });

  const onLoad = useCallback((mapInstance: any) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const pathCoords = itinerary.map(item => ({ lat: item.lat, lng: item.lng }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 p-4 md:p-8 flex flex-col">
      <style dangerouslySetInnerHTML={{__html: `
        .gm-err-container { display: none !important; }
        .gm-err-content { display: none !important; }
        .dismissButton { display: none !important; }
      `}} />
      <div className="max-w-[1400px] w-full mx-auto h-[90vh] flex flex-col">
        
        {/* === Header Section === */}
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Sparkles className="text-indigo-400 w-8 h-8" aria-hidden="true" />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                GeoSmart Travel Engine
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium ml-11">Powered by Google Gemini & Maps</p>
          </div>
        </header>

        <section className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0" aria-label="Main Application Area">
          
          {/* === LEFT COLUMN: Controls & Timeline === */}
          <div className="lg:col-span-5 flex flex-col gap-6 overflow-hidden">
            
            {/* 1. Input Form Component */}
            <article className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-2xl shrink-0" aria-labelledby="form-heading">
              <h2 id="form-heading" className="sr-only">Travel Preferences Form</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="destination-input" className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1.5 block">Destination</label>
                    <input id="destination-input" type="text" value={destination} onChange={e => setDestination(e.target.value)}
                      aria-label="Destination Input"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                  </div>
                  <div>
                    <label htmlFor="budget-input" className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1.5 block">Budget</label>
                    <input id="budget-input" type="text" value={budget} onChange={e => setBudget(e.target.value)}
                      aria-label="Budget Input"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label htmlFor="vibe-input" className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1.5 block">Vibe & Preferences</label>
                  <input id="vibe-input" type="text" value={vibe} onChange={e => setVibe(e.target.value)}
                    aria-label="Vibe and Preferences Input"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                </div>
                <button 
                  onClick={() => generateTrip(destination, budget, vibe, map)} 
                  disabled={loading}
                  aria-label="Generate Itinerary"
                  aria-busy={loading}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all flex justify-center items-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-950"
                >
                  {loading ? <><Loader2 className="animate-spin w-5 h-5" aria-hidden="true" /> Optimizing Route...</> : <><Navigation className="w-5 h-5" aria-hidden="true" /> Generate Geo-Itinerary</>}
                </button>
              </div>
            </article>

            {/* 2. Timeline Component */}
            <article className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 flex-1 overflow-hidden flex flex-col relative" aria-labelledby="timeline-heading">
              <div className="flex justify-between items-end mb-4 shrink-0">
                <h2 id="timeline-heading" className="text-lg font-bold">Dynamic Itinerary</h2>
                {itinerary.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                    <input type="text" placeholder="e.g. Heavy Rain" value={disruption} onChange={e => setDisruption(e.target.value)}
                      aria-label="Disruption Event Input"
                      className="bg-slate-800 text-white border-2 border-red-500/80 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-red-400 outline-none placeholder:text-slate-400 font-medium shadow-inner" />
                    <button 
                      onClick={() => simulateDisruption(disruption, map)} 
                      disabled={loading || !disruption}
                      aria-label="Simulate Disruption"
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 focus:ring-2 focus:ring-red-500"
                    >
                      <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Disrupt
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800" aria-live="polite">
                <AnimatePresence mode="popLayout">
                  {itinerary.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-slate-500 italic space-y-4">
                      <MapPin className="w-12 h-12 text-slate-800" aria-hidden="true" />
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
            </article>
          </div>

          {/* === RIGHT COLUMN: Visual Map & Logs === */}
          <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden">
            
            {/* 3. Google Map Component */}
            <article className="bg-slate-900 border border-slate-800/60 rounded-3xl p-2 h-2/3 shadow-2xl relative overflow-hidden group" aria-label="Interactive Map">
              <div className="absolute top-6 left-6 z-10 bg-slate-950/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-800 shadow-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" aria-hidden="true" />
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
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-slate-500 font-mono text-sm border border-slate-800/50" aria-live="polite">
                  {loadError ? "MAPS_API_KEY Missing (Developer Mode Active)" : "Initializing Google Maps Platform..."}
                </div>
              )}
            </article>

            {/* 4. Agent Console Component */}
            <aside className="bg-black/80 border border-slate-800/80 rounded-3xl p-5 flex-1 shadow-2xl font-mono text-xs overflow-hidden flex flex-col" aria-label="System Logs">
              <div className="text-slate-500 mb-3 border-b border-slate-800 pb-2 uppercase tracking-widest font-bold flex justify-between">
                <span>System Logs</span>
                <span>v2.0.0</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 flex flex-col justify-end" aria-live="polite" aria-atomic="false">
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
            </aside>

          </div>
        </section>
      </div>
    </main>
  );
}
