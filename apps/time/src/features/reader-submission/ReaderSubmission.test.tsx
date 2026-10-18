import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { ReaderSubmission } from './ReaderSubmission';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('отправляет файлы только после согласия и успешной загрузки', async () => {
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: vi.fn(() => 'blob:photo'),
      revokeObjectURL: vi.fn(),
    }),
  );
  const user = userEvent.setup();
  const repo = makeRepositories();
  const send = vi.spyOn(repo.submissions, 'send').mockResolvedValue({ id: 'receipt' });
  vi.spyOn(repo.media, 'upload').mockResolvedValue({
    id: 'photo',
    type: 'image',
    url: 'https://example.com/photo.jpg',
    alt: '',
  });
  renderWithApp(<ReaderSubmission articleId="a-1" />, repo);
  await user.type(screen.getByLabelText('Как к вам обращаться'), 'Анна');
  await user.type(screen.getByLabelText('Email или телефон'), 'anna@example.com');
  await user.upload(
    screen.getByLabelText('Фото и видео для редакции', { selector: 'input' }),
    new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }),
  );
  const submit = screen.getByRole('button', { name: 'Отправить в редакцию' });
  await waitFor(() => expect(submit).toBeEnabled());
  await user.click(submit);
  expect(await screen.findByRole('alert')).toHaveTextContent('согласие');
  expect(send).not.toHaveBeenCalled();
  await user.click(screen.getByRole('checkbox', { name: /Я автор/ }));
  await user.click(submit);
  expect(await screen.findByRole('status')).toHaveTextContent('получила файлы');
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({ articleId: 'a-1', mediaIds: ['photo'], consent: true }),
  );
});
