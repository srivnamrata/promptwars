import { useState } from 'react';
import { Activity } from '@/types';
import { generateItinerary } from '@/actions/gemini';
import { db, collection, addDoc } from '@/config/firebase';

/**
 * Custom hook to manage the Gemini AI state and interactions.
 */
export function useGemini() {
  const [itinerary, setItinerary] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
      
      const response = await generateItinerary(prompt);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      const data = response.data;
      setItinerary(data.itinerary);
      setLogs(prev => [...prev, ...data.logs, "✅ System: Plan generation complete."]);
      
      // Save to Firebase Firestore to maximize Google Cloud usage
      try {
        await addDoc(collection(db, "trips"), { destination, budget, vibe, itinerary: data.itinerary, timestamp: new Date() });
      } catch (err) {
        console.error("Firebase log error:", err);
      }

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
      
      const response = await generateItinerary(prompt);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      const data = response.data;
      setItinerary(data.itinerary);
      setLogs(prev => [...prev, ...data.logs, "✅ System: Itinerary successfully adapted."]);
      
      // Save disruption plan to Firebase Firestore
      try {
        await addDoc(collection(db, "disruptions"), { disruption, itinerary: data.itinerary, timestamp: new Date() });
      } catch (err) {
        console.error("Firebase log error:", err);
      }

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
