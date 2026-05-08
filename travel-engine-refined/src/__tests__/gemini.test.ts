import { generateItinerary } from '@/actions/gemini';

// Mock the global fetch API to prevent actual network requests during testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      candidates: [{ 
        content: { 
          parts: [{ 
            text: '{"logs":["System ready"], "itinerary":[{"time":"10:00 AM", "activity":"Test Activity", "cost":"$0", "reason":"Testing", "lat":0, "lng":0}]}' 
          }] 
        } 
      }]
    })
  })
) as jest.Mock;

describe('Gemini Server Action Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key-mock' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('securely calls the Gemini API and parses the JSON response correctly', async () => {
    const result = await generateItinerary('Test Prompt');
    
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    // Ensure the fetch was called with the correct secure API key from the environment
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('key=test-api-key-mock'),
      expect.any(Object)
    );

    if (result.success) {
      expect(result.data.itinerary.length).toBeGreaterThan(0);
      expect(result.data.itinerary[0].activity).toBe('Test Activity');
    }
  });

  it('throws a structured error when the Server API Key is missing', async () => {
    process.env.GEMINI_API_KEY = ''; // Remove key to test error handling
    
    const result = await generateItinerary('Test Prompt');
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error).toContain('Server API Key is missing');
    }
  });
});
