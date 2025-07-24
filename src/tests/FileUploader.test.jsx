import { render, screen } from '@testing-library/react';
import FileUploader from '../components/FileUploader';

test('renders drag and drop area', () => {
  render(<FileUploader onFileUpload={() => {}} />);
  expect(screen.getByText(/Drag and drop a RAW file here/i)).toBeInTheDocument();
});
