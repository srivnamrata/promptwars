import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock the Google Maps API
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: () => <div data-testid="mock-google-map">Google Map Mock</div>,
  useJsApiLoader: () => ({ isLoaded: true, loadError: null }),
  Marker: () => <div data-testid="mock-marker">Marker</div>,
  Polyline: () => <div data-testid="mock-polyline">Polyline</div>,
}));

// Mock the Custom Gemini Hook
jest.mock('@/hooks/useGemini', () => ({
  useGemini: () => ({
    itinerary: [],
    logs: ['System: Ready'],
    loading: false,
    generateTrip: jest.fn(),
    simulateDisruption: jest.fn()
  })
}));

describe('Home Page Validation', () => {
  it('renders the GeoSmart Travel Engine header', () => {
    render(<Home />);
    expect(screen.getByText('GeoSmart Travel Engine')).toBeInTheDocument();
  });

  it('contains accessible input fields for destination and budget', () => {
    render(<Home />);
    // Check for accessibility aria-labels
    expect(screen.getByLabelText('Destination Input')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget Input')).toBeInTheDocument();
  });

  it('renders the Google Map component', () => {
    render(<Home />);
    expect(screen.getByTestId('mock-google-map')).toBeInTheDocument();
  });
});
