import { render, screen } from '@testing-library/react';
import Gallery from '../components/Gallery';

test('renders empty gallery message', () => {
  render(<Gallery files={[]} />);
  expect(screen.getByText(/No images yet/i)).toBeInTheDocument();
});
