import { render, screen } from '@testing-library/react';
import ImageEditor from '../components/ImageEditor';

test('renders image editor', () => {
  render(<ImageEditor image="test.jpg" onEdit={() => {}} />);
  expect(screen.getByText(/Edit Image/i)).toBeInTheDocument();
});
