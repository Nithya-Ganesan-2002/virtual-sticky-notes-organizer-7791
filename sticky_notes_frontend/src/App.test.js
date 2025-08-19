import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Sticky Notes title', () => {
  render(<App />);
  const title = screen.getByText(/Sticky Notes/i);
  expect(title).toBeInTheDocument();
});
