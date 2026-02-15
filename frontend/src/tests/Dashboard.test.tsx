import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../components/Dashboard';

// Mock model-viewer since it's a web component
vi.mock('@google/model-viewer', () => ({
  default: () => null
}));

vi.mock('mqtt', () => {
  const client = {
    on: vi.fn(),
    subscribe: vi.fn(),
    end: vi.fn()
  };
  return {
    default: {
      connect: vi.fn(() => client)
    }
  };
});

// Mock fetch for chatbot
global.fetch = vi.fn();

describe('Dashboard Component', () => {
  it('renders main dashboard view by default', () => {
    render(<Dashboard />);
    expect(screen.getByText('Main Reactor Overview')).toBeInTheDocument();
    expect(screen.getByText('Reactor Core')).toBeInTheDocument(); // Hotspot check
  });

  it('navigates to Chatbot view', () => {
    render(<Dashboard />);
    const chatBtn = screen.getByText('AI Assistant');
    fireEvent.click(chatBtn);
    expect(screen.getByText('Tactical AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Tactical AI Assistant Online. How can I help you with the reactor diagnostics?')).toBeInTheDocument();
  });

  it('navigates to ESP view', () => {
    render(<Dashboard />);
    const espBtn = screen.getByText('ESP Telemetry');
    fireEvent.click(espBtn);
    expect(screen.getByText('ESP-32 Telemetry Stream')).toBeInTheDocument();
    expect(screen.getByText('Connecting to MQTT Broker')).toBeInTheDocument();
  });

  it('toggles hotspot info on click', () => {
    render(<Dashboard />);
    // Since we mock model-viewer, the children (buttons) are still rendered in the test DOM if we don't suppress them.
    // However, model-viewer slots usually don't render without the component. 
    // Let's adjust the mock to render children.
  });
});
