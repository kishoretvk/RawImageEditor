import { render, screen } from '@testing-library/react';
import ImageMetadata from '../components/ImageMetadata';

test('renders image metadata', () => {
  render(<ImageMetadata metadata={{ filename: 'test.jpg', size: '1 MB', type: 'image/jpeg' }} />);
  expect(screen.getByText(/Image Metadata/i)).toBeInTheDocument();
});
