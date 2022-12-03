// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { expect, it, describe } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  it('should render a placeholder message', () => {
    render(<App></App>);

    expect(screen.getByText(/Hello, Inter Protocol!/i)).toBeDefined();
  });
});
