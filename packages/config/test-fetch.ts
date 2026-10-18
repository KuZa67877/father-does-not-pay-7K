import { transferableAbortController } from 'node:util';

// fetch/Request в Node 24 проверяют внутренний тип сигнала; сигнал jsdom им не подходит.
// Запросы и TanStack Query должны использовать одну, нативную пару классов.
const controller = transferableAbortController();
globalThis.AbortController = controller.constructor as typeof AbortController;
globalThis.AbortSignal = controller.signal.constructor as typeof AbortSignal;
