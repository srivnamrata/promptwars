import { GoogleGenAI } from '@google/genai';
export const runtime = 'edge';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { destination, budget, vibe, isDisruption, disruptionEvent, currentItinerary } = body;

    let prompt = '';
    
    if (isDisruption) {
      prompt = `
      You are an expert travel operations AI. A disruption has occurred!
      Disruption: ${disruptionEvent}
      Current Itinerary: ${JSON.stringify(currentItinerary)}
      
      Your task is to REPLAN the itinerary to accommodate this disruption. 
      Keep unaffected items. Replace ruined items with indoor/suitable alternatives within the same budget and area.
      Explain WHY the change was made in the 'reason' field.
      
      Respond STRICTLY in this JSON format:
      {
        "logs": ["List of 3-4 agent action logs like 'Weather agent detected rain', 'Replanning agent finding indoor cafes'"],
        "itinerary": [
          { "time": "9:00 AM", "activity": "Activity name", "cost": "$10", "reason": "Why chosen" }
        ]
      }
      `;
    } else {
      prompt = `
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
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = response.text;
    return new Response(result, { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error("GEMINI API ERROR:", error);
    return new Response(JSON.stringify({ error: 'Failed to plan', details: error.message || String(error) }), { status: 500 });
  }
}
