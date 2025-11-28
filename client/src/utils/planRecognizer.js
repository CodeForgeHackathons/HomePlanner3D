/**
 * Главный модуль распознавания планов помещений
 * Использует ТОЛЬКО нейросети (ML) для распознавания
 */

// Импортируем ML распознаватель
let mlRecognizer = null;
async function getMLRecognizer() {
  if (!mlRecognizer) {
    mlRecognizer = await import('./mlPlanRecognizer.js');
  }
  return mlRecognizer;
}

/**
 * Распознаёт план из загруженного файла
 * Использует ТОЛЬКО нейросети (ML)
 */
export async function recognizePlan(file) {
  const mlModule = await getMLRecognizer();
  return await mlModule.recognizePlanML(file);
}
