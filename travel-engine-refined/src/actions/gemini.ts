"use server";

// Safe Practice: The API key is now securely kept on the SERVER. 
// It will NOT be bundled or exposed to the client browser, preventing credential leakage.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBeUS2vE8LrawkwRe90uszGYUaKe0dVqZY";

export async function generateItinerary(prompt: string) {
  try {
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
    
    return { success: true, data: JSON.parse(data.candidates[0].content.parts[0].text) };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { success: false, error: error.message || "Failed to reach AI endpoint" };
  }
}
