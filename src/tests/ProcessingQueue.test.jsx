import { render, screen } from '@testing-library/react';
import ProcessingQueue from '../components/ProcessingQueue';

test('renders processing queue', () => {
  render(<ProcessingQueue queue={[]} onRemove={() => {}} />);
  expect(screen.getByText(/Processing Queue/i)).toBeInTheDocument();
});
