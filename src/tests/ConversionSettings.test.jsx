import { render, screen } from '@testing-library/react';
import ConversionSettings from '../components/ConversionSettings';

test('renders conversion settings', () => {
  render(<ConversionSettings settings={{ quality: 80, format: 'jpeg', resize: 0 }} onChange={() => {}} />);
  expect(screen.getByText(/Conversion Settings/i)).toBeInTheDocument();
});
