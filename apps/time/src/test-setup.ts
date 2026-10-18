import '@testing-library/jest-dom/vitest';
import '@dle/config/test-fetch';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
