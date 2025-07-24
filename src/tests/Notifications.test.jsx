import { render, screen } from '@testing-library/react';
import Notifications from '../components/Notifications';

test('renders notification', () => {
  render(<Notifications message="Success!" type="success" onClose={() => {}} />);
  expect(screen.getByText(/Success!/i)).toBeInTheDocument();
});
