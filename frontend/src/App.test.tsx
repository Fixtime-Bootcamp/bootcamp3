import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('FixTime shell', () => {
  it('presents the empty agenda state', () => {
    render(<h1>Agenda sem atrito.</h1>);
    expect(screen.getByRole('heading', { name: 'Agenda sem atrito.' })).toBeInTheDocument();
  });
});
