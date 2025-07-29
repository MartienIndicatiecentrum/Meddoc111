import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientAwareChat } from '../components/ClientAwareChat';

describe('ClientAwareChat', () => {
  test('renders open chat button', () => {
    render(<ClientAwareChat />);

    const button = screen.getByRole('button', { name: /open ai chat/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Open Chat');
  });

  test('opens chat dialog when button clicked', async () => {
    const user = userEvent.setup();
    render(<ClientAwareChat />);

    const openButton = screen.getByRole('button', { name: /open ai chat/i });
    await user.click(openButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
  });

  test('closes chat dialog when close button clicked', async () => {
    const user = userEvent.setup();
    render(<ClientAwareChat />);

    // Open chat
    await user.click(screen.getByRole('button', { name: /open ai chat/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close chat
    await user.click(screen.getByRole('button', { name: /close chat/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('shows client dropdown when chat is open', async () => {
    const user = userEvent.setup();
    render(<ClientAwareChat />);

    await user.click(screen.getByRole('button', { name: /open ai chat/i }));

    const dropdown = screen.getByTestId('client-dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveDisplayValue('Select client');
  });

  test('shows disabled input and send button', async () => {
    const user = userEvent.setup();
    render(<ClientAwareChat />);

    await user.click(screen.getByRole('button', { name: /open ai chat/i }));

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send message/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  test('accepts custom className prop', () => {
    const { container } = render(<ClientAwareChat className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});