import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders home page hero', () => {
  render(<App />);
  expect(screen.getByText(/Unleash the RAW Power/i)).toBeInTheDocument();
});

test('renders upload section', () => {
  render(<App />);
  expect(screen.getByText(/Upload and Convert/i)).toBeInTheDocument();
});
