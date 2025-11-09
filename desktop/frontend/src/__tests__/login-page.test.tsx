import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '@/pages/Auth/LoginPage';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockedStore = useAuthStore as unknown as vi.Mock;

const setupStore = (overrides?: Partial<ReturnType<typeof createMockState>>) => {
  const base = createMockState(overrides);
  mockedStore.mockImplementation((selector: (state: typeof base) => unknown) => selector(base));
  return base;
};

const createMockState = (overrides?: Partial<{
  login: ReturnType<typeof vi.fn>;
  status: string;
  error: string | null;
}>) => ({
  login: overrides?.login ?? vi.fn().mockResolvedValue(true),
  status: overrides?.status ?? 'idle',
  error: overrides?.error ?? null,
});

const renderWithRouter = () => render(
  <MemoryRouter>
    <LoginPage />
  </MemoryRouter>,
);

describe('LoginPage', () => {
  it('disables submit when fields empty', () => {
    setupStore({
      login: vi.fn(),
    });
    renderWithRouter();
    const button = screen.getByRole('button', { name: /进入控制台/i });
    expect(button).toBeDisabled();
  });

  it('enables submit when identifier and password provided', () => {
    const loginSpy = vi.fn().mockResolvedValue(true);
    setupStore({ login: loginSpy });
    renderWithRouter();
    fireEvent.change(screen.getByLabelText(/邮箱/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/密码/i), { target: { value: 'secret' } });
    const button = screen.getByRole('button', { name: /进入控制台/i });
    expect(button).toBeEnabled();
  });
});
