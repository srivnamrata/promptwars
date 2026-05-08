# 🏆 PromptWar Strategy: Google-Powered Travel Engine

Since the goal is an end-to-end app maximizing Google services hosted on Cloud Run, we are shifting to a high-impact, serverless architecture.

## 🏗️ The Tech Stack (The "Google Maximum" Approach)
* **Frontend/Backend:** Next.js (App Router) - Great for building fast UIs and handling API routes securely.
* **Brain:** **Google Gemini API (1.5 Pro/Flash)** - Handles the complex dynamic planning and real-time updates.
* **Visuals/Data:** **Google Maps Platform** (Maps JS API, Places API) - Renders the itinerary visually and validates locations.
* **Hosting:** **Google Cloud Run** - Containerized, auto-scaling, serverless deployment.

---

## ⏱️ Execution Plan (180 Minutes)

### Phase 1: Setup & Scaffolding (0:00 - 0:20)
1. **Initialize Project:** Create a Next.js App with Tailwind CSS.
2. **GCP Setup:** 
   * Create a Google Cloud Project.
   * Enable **Generative Language API** (or Vertex AI), **Maps JavaScript API**, and **Places API**.
   * Generate API Keys.

### Phase 2: Core Gemini Engine (API Route) (0:20 - 1:00)
1. **The Prompt:** Write the core system prompt that takes `destination`, `budget`, `duration`, and `preferences` and returns a **JSON array** of daily activities.
2. **Next.js API Route:** Build `/api/plan` which calls the Gemini API. Enforce a strict JSON schema output so the frontend can easily map it.

### Phase 3: The "Wow" Frontend & Maps (1:00 - 1:50)
1. **UI Design:** Build a sleek, modern UI using Tailwind CSS. It should have a form on the left (preferences/constraints) and the itinerary on the right.
2. **Map Integration:** Use the Google Maps JS API to render a map. Plot markers for each location the Gemini API returns.
3. **Real-time Disruption Feature:** Add a "Simulate Chaos" button (e.g., "Flight Delayed 4 hours"). This sends the *current* itinerary and the *disruption* back to Gemini to generate a revised JSON itinerary.

### Phase 4: Docker & Cloud Run Deployment (1:50 - 2:30)
1. **Dockerize:** Create a multi-stage `Dockerfile` for the Next.js app.
2. **Deploy:** 
   * Build the image: `gcloud builds submit --tag gcr.io/[PROJECT_ID]/travel-engine`
   * Deploy: `gcloud run deploy travel-engine --image gcr.io/[PROJECT_ID]/travel-engine --platform managed --allow-unauthenticated`
3. **Environment Variables:** Ensure API keys are securely added as environment variables in Cloud Run.

### Phase 5: Polish & Pitch (2:30 - 3:00)
* Ensure error handling (what if Gemini returns invalid JSON?).
* Add a loading skeleton while Gemini thinks.
* Rehearse the demo.

---

## 🚀 Immediate Next Steps
I will now prepare to initialize the Next.js project and write the `Dockerfile` for Cloud Run.
