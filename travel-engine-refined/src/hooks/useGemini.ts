import { useState } from 'react';
import { Activity } from '@/types';

// Use the API key directly on the client for the hackathon MVP to bypass local Windows SWC/Node bugs
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyBeUS2vE8LrawkwRe90uszGYUaKe0dVqZY";

/**
 * Custom hook to manage the Gemini AI state and interactions.
 * Abstracts away the fetch logic and data parsing.
 */
export function useGemini() {
  const [itinerary, setItinerary] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Internal helper to call the Gemini REST API.
   */
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

  /**
   * Generates a brand new intelligent itinerary based on user preferences.
   */
  const generateTrip = async (destination: string, budget: string, vibe: string, mapInstance: any) => {
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
      
      // Auto-fit the map to the new coordinates
      if (mapInstance && data.itinerary.length > 0 && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        data.itinerary.forEach((item: Activity) => {
          bounds.extend({ lat: item.lat, lng: item.lng });
        });
        mapInstance.fitBounds(bounds);
      }
    } catch (e: any) {
      setLogs(["System ERROR: " + (e.message || "Failed to reach AI endpoint.")]);
    }
    setLoading(false);
  };

  /**
   * Dynamically replans the trip when a disruption occurs.
   */
  const simulateDisruption = async (disruption: string, mapInstance: any) => {
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
      
      if (mapInstance && data.itinerary.length > 0 && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        data.itinerary.forEach((item: Activity) => {
          bounds.extend({ lat: item.lat, lng: item.lng });
        });
        mapInstance.fitBounds(bounds);
      }
    } catch (e: any) {
      setLogs(prev => [...prev, "System ERROR: Re-planning failed: " + e.message]);
    }
    setLoading(false);
  };

  return { itinerary, logs, loading, generateTrip, simulateDisruption };
}
