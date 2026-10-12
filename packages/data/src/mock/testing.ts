/**
 * Обработчики мока для тестов в Node (msw/node): те же фикстуры и правила,
 * что и в браузере. В прод-сборку не попадает — импортируется только из тестов.
 */
export { createVeloraHandlers, createVeloraMockDb } from './velora/handlers';
export { createTimeHandlers, createTimeMockDb } from './time/handlers';
