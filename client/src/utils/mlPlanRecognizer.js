/**
 * ML-модуль распознавания планов на основе нейросетей
 * Заменяет алгоритмический подход на deep learning
 */

import { loadAllModels, getTensorFlow, getModels } from './mlModelLoader.js';
import { imageToCanvas } from './imageProcessor.js';

// Импорты для обработки файлов
let pdfProcessor = null;
let ocrProcessor = null;

async function getPdfProcessor() {
  if (!pdfProcessor) {
    pdfProcessor = await import('./pdfProcessor.js');
  }
  return pdfProcessor;
}

async function getOcrProcessor() {
  if (!ocrProcessor) {
    ocrProcessor = await import('./ocrProcessor.js');
  }
  return ocrProcessor;
}

/**
 * Преобразует изображение в тензор для ML модели
 */
async function imageToTensor(image, targetSize = [512, 512]) {
  const tf = await getTensorFlow();
  const { canvas, width, height, ctx } = imageToCanvas(image, targetSize[0], targetSize[1]);
  
  // Получаем ImageData
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Преобразуем в тензор
  const tensor = tf.browser.fromPixels(imageData)
    .resizeNearestNeighbor(targetSize)
    .toFloat()
    .div(255.0) // Нормализация [0, 1]
    .expandDims(0); // Добавляем batch dimension
  
  return { tensor, originalWidth: width, originalHeight: height };
}

/**
 * Детекция стен с помощью ML модели
 */
async function detectWallsML(image) {
  const models = getModels();
  
  if (!models.wallDetection) {
    console.warn('ML модель детекции стен недоступна, используем fallback');
    return null;
  }
  
  try {
    const tf = await getTensorFlow();
    const { tensor, originalWidth, originalHeight } = await imageToTensor(image, [512, 512]);
    
    // Предсказание модели
    const prediction = models.wallDetection.predict(tensor);
    
    // Обработка результатов (зависит от формата вывода модели)
    // Предполагаем, что модель возвращает маску или координаты стен
    const wallsData = await prediction.data();
    prediction.dispose();
    tensor.dispose();
    
    // Преобразуем выход модели в формат стен
    // Это зависит от архитектуры модели - здесь примерная структура
    const walls = parseWallsFromMLOutput(wallsData, originalWidth, originalHeight);
    
    return walls;
  } catch (error) {
    console.error('Ошибка ML детекции стен:', error);
    return null;
  }
}

/**
 * Парсит выход ML модели в формат стен
 * Адаптируйте под формат вашей модели
 */
function parseWallsFromMLOutput(modelOutput, width, height) {
  const walls = [];
  
  // Пример: если модель возвращает маску или координаты
  // Здесь нужно адаптировать под конкретную архитектуру модели
  // Например, YOLO возвращает bounding boxes, segmentation модели - маски
  
  // Для примера: если модель возвращает маску (H x W x 2), где
  // канал 0 = горизонтальные стены, канал 1 = вертикальные стены
  const outputShape = [height, width, 2]; // Примерная форма
  
  // Преобразуем маску в линии стен
  // Это упрощенный пример - реальная реализация зависит от модели
  
  return walls;
}

/**
 * Сегментация комнат с помощью ML модели
 */
async function segmentRoomsML(image) {
  const models = getModels();
  
  if (!models.roomSegmentation) {
    console.warn('ML модель сегментации комнат недоступна, используем fallback');
    return null;
  }
  
  try {
    const tf = await getTensorFlow();
    const { tensor, originalWidth, originalHeight } = await imageToTensor(image, [512, 512]);
    
    // Предсказание модели
    const prediction = models.roomSegmentation.predict(tensor);
    const segmentationData = await prediction.data();
    prediction.dispose();
    tensor.dispose();
    
    // Преобразуем маску сегментации в комнаты
    const rooms = parseRoomsFromSegmentation(segmentationData, originalWidth, originalHeight);
    
    return rooms;
  } catch (error) {
    console.error('Ошибка ML сегментации комнат:', error);
    return null;
  }
}

/**
 * Парсит маску сегментации в формат комнат
 */
function parseRoomsFromSegmentation(segmentationData, width, height) {
  const rooms = [];
  
  // Преобразуем маску сегментации в полигоны комнат
  // Используем алгоритм контуров для извлечения границ
  
  // Примерная логика:
  // 1. Найти уникальные метки в маске
  // 2. Для каждой метки найти контур
  // 3. Преобразовать контур в полигон вершин
  // 4. Вычислить площадь
  
  return rooms;
}

/**
 * Извлечение метаданных с помощью ML
 */
async function extractMetadataML(image) {
  const models = getModels();
  
  if (!models.metadataExtraction) {
    console.warn('ML модель метаданных недоступна, используем OCR fallback');
    return null;
  }
  
  try {
    const tf = await getTensorFlow();
    const { tensor } = await imageToTensor(image, [512, 512]);
    
    // Предсказание модели
    const prediction = models.metadataExtraction.predict(tensor);
    const metadataData = await prediction.data();
    prediction.dispose();
    tensor.dispose();
    
    // Преобразуем выход модели в метаданные
    const metadata = parseMetadataFromMLOutput(metadataData);
    
    return metadata;
  } catch (error) {
    console.error('Ошибка ML извлечения метаданных:', error);
    return null;
  }
}

/**
 * Парсит выход ML модели в метаданные
 */
function parseMetadataFromMLOutput(modelOutput) {
  // Зависит от формата вывода модели
  // Может быть классификация, регрессия или sequence-to-sequence
  
  return {
    area: null,
    address: null,
    ceilingHeight: null,
    scale: null,
    rooms: []
  };
}

/**
 * Главная функция распознавания плана с использованием ML
 */
export async function recognizePlanML(file) {
  try {
    // Инициализируем модели (ленивая загрузка)
    const models = await loadAllModels();
    
    let image = null;
    let metadata = {};
    const fileType = file.type || file.name.split('.').pop().toLowerCase();
    
    // Обработка PDF
    if (fileType === 'pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      console.log('Обработка PDF файла...');
      const pdfModule = await getPdfProcessor();
      image = await pdfModule.extractImageFromPDF(file);
      
      // Пытаемся извлечь метаданные из текста PDF
      try {
        const text = await pdfModule.extractTextFromPDF(file);
        metadata = pdfModule.parseMetadataFromText(text);
      } catch (error) {
        console.warn('Не удалось извлечь текст из PDF:', error);
      }
    }
    // Обработка изображений
    else if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(fileType)) {
      console.log('Обработка изображения...');
      const { loadImageFromFile } = await import('./imageProcessor.js');
      image = await loadImageFromFile(file);
      
      // OCR для метаданных (fallback, если ML недоступен)
      try {
        const ocrModule = await getOcrProcessor();
        const ocrText = await ocrModule.extractTextFromImage(image);
        const ocrMetadata = ocrModule.parseMetadataFromOCRText(ocrText);
        metadata = { ...metadata, ...ocrMetadata };
      } catch (error) {
        console.warn('Не удалось выполнить OCR:', error);
      }
    } else {
      throw new Error('Неподдерживаемый формат файла');
    }
    
    if (!image) {
      throw new Error('Не удалось загрузить изображение');
    }
    
    // Проверяем, что модели загружены
    if (!areMLModelsLoaded()) {
      throw new Error('ML модели не загружены. Убедитесь, что модели доступны и загружены.');
    }
    
    console.log('Используем нейросети (ML) для распознавания плана...');
    
    // Параллельная обработка с помощью ML моделей
    const [wallsResult, roomsResult, metadataResult] = await Promise.allSettled([
      detectWallsML(image),
      segmentRoomsML(image),
      extractMetadataML(image)
    ]);
    
    const walls = wallsResult.status === 'fulfilled' ? wallsResult.value : null;
    const rooms = roomsResult.status === 'fulfilled' ? roomsResult.value : null;
    const mlMetadata = metadataResult.status === 'fulfilled' ? metadataResult.value : null;
    
    // Проверяем, что ML модели дали результат
    if (!walls || walls.length === 0) {
      throw new Error('Нейросеть не смогла обнаружить стены на плане. Проверьте качество изображения.');
    }
    
    if (!rooms || rooms.length === 0) {
      throw new Error('Нейросеть не смогла обнаружить комнаты на плане. Проверьте качество изображения.');
    }
    
    // Форматируем результат ML
    const { formatWalls, formatRooms } = await import('./imageProcessor.js');
    const scale = mlMetadata?.scale || metadata.scale || estimateScale(walls, metadata.area);
    
    const roomsText = formatRooms(rooms, scale);
    const wallsText = formatWalls(walls, scale);
    
    // Определяем тип квартиры
    const livingRoomsCount = rooms.filter(r => r.isLivingRoom !== false && r.area >= 8).length;
    const apartmentType = determineApartmentType(livingRoomsCount);
    
    return {
      success: true,
      rooms: roomsText,
      walls: wallsText,
      area: mlMetadata?.area || metadata.area || calculateTotalArea(rooms),
      ceilingHeight: mlMetadata?.ceilingHeight || metadata.ceilingHeight,
      address: mlMetadata?.address || metadata.address,
      apartmentType: apartmentType,
      stats: {
        roomsFound: rooms.length,
        livingRoomsFound: livingRoomsCount,
        wallsFound: walls.length,
        method: 'ml-neural-network'
      }
    };
    
  } catch (error) {
    console.error('Ошибка ML распознавания:', error);
    return {
      success: false,
      error: error.message || 'Неизвестная ошибка при распознавании плана'
    };
  }
}

/**
 * Проверяет, загружены ли ML модели
 */
export function areMLModelsLoaded() {
  const models = getModels();
  return models.wallDetection !== null || models.roomSegmentation !== null;
}

/**
 * Вспомогательные функции
 */
function estimateScale(walls, knownArea) {
  if (!walls || walls.length === 0) return 0.005;
  // Упрощенная оценка масштаба
  return 0.005; // По умолчанию 1:200
}

function calculateTotalArea(rooms) {
  if (!rooms || rooms.length === 0) return null;
  return rooms
    .filter(r => r.area >= 1.5)
    .reduce((sum, r) => sum + (r.area || 0), 0)
    .toFixed(1);
}

function determineApartmentType(livingRoomsCount) {
  if (livingRoomsCount === 0) return 'Студия';
  if (livingRoomsCount === 1) return '1-комнатная';
  if (livingRoomsCount === 2) return '2-комнатная';
  if (livingRoomsCount === 3) return '3-комнатная';
  return '3+ комнатная';
}

