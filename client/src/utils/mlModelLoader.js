/**
 * Модуль загрузки и управления ML-моделями для распознавания планов
 * Использует TensorFlow.js для работы с нейросетями в браузере
 */

let tf = null;
let wallDetectionModel = null;
let roomSegmentationModel = null;
let metadataExtractionModel = null;
let modelsLoaded = false;

/**
 * Ленивая инициализация TensorFlow.js
 */
async function initTensorFlow() {
  if (tf) return tf;
  
  try {
    tf = await import('@tensorflow/tfjs');
    console.log('TensorFlow.js загружен успешно');
    return tf;
  } catch (error) {
    console.error('Ошибка загрузки TensorFlow.js:', error);
    throw new Error('Не удалось загрузить TensorFlow.js. Убедитесь, что библиотека установлена.');
  }
}

/**
 * Загружает модель для детекции стен
 * Модель может быть локальной или загружаться с сервера
 */
async function loadWallDetectionModel(modelPath = null) {
  try {
    const tfModule = await initTensorFlow();
    
    // Если путь не указан, используем дефолтный (можно настроить)
    const defaultPath = modelPath || '/models/wall-detection/model.json';
    
    try {
      // Пытаемся загрузить модель с указанного пути
      wallDetectionModel = await tfModule.loadLayersModel(defaultPath);
      console.log('Модель детекции стен загружена');
      return wallDetectionModel;
    } catch (loadError) {
      console.warn('Не удалось загрузить модель с локального пути, используем API:', loadError);
      
      // Fallback: загрузка через API (если есть сервер с моделями)
      // В реальном проекте здесь будет вызов API вашего сервера
      // const response = await fetch('https://your-api.com/models/wall-detection');
      // wallDetectionModel = await tfModule.loadLayersModel(response);
      
      // Для прототипа: возвращаем null, будет использован fallback алгоритм
      return null;
    }
  } catch (error) {
    console.error('Ошибка загрузки модели детекции стен:', error);
    return null;
  }
}

/**
 * Загружает модель для сегментации комнат
 */
async function loadRoomSegmentationModel(modelPath = null) {
  try {
    const tfModule = await initTensorFlow();
    const defaultPath = modelPath || '/models/room-segmentation/model.json';
    
    try {
      roomSegmentationModel = await tfModule.loadLayersModel(defaultPath);
      console.log('Модель сегментации комнат загружена');
      return roomSegmentationModel;
    } catch (loadError) {
      console.warn('Не удалось загрузить модель сегментации, используем fallback');
      return null;
    }
  } catch (error) {
    console.error('Ошибка загрузки модели сегментации:', error);
    return null;
  }
}

/**
 * Загружает модель для извлечения метаданных (площадь, адрес и т.д.)
 */
async function loadMetadataExtractionModel(modelPath = null) {
  try {
    const tfModule = await initTensorFlow();
    const defaultPath = modelPath || '/models/metadata-extraction/model.json';
    
    try {
      metadataExtractionModel = await tfModule.loadLayersModel(defaultPath);
      console.log('Модель извлечения метаданных загружена');
      return metadataExtractionModel;
    } catch (loadError) {
      console.warn('Не удалось загрузить модель метаданных, используем OCR fallback');
      return null;
    }
  } catch (error) {
    console.error('Ошибка загрузки модели метаданных:', error);
    return null;
  }
}

/**
 * Инициализирует все модели
 * @param {Object} config - Конфигурация путей к моделям
 */
export async function loadAllModels(config = {}) {
  if (modelsLoaded) {
    return {
      wallDetection: wallDetectionModel,
      roomSegmentation: roomSegmentationModel,
      metadataExtraction: metadataExtractionModel
    };
  }
  
  try {
    await initTensorFlow();
    
    const [wallModel, roomModel, metadataModel] = await Promise.all([
      loadWallDetectionModel(config.wallModelPath),
      loadRoomSegmentationModel(config.roomModelPath),
      loadMetadataExtractionModel(config.metadataModelPath)
    ]);
    
    wallDetectionModel = wallModel;
    roomSegmentationModel = roomModel;
    metadataExtractionModel = metadataModel;
    
    modelsLoaded = true;
    
    return {
      wallDetection: wallDetectionModel,
      roomSegmentation: roomSegmentationModel,
      metadataExtraction: metadataExtractionModel
    };
  } catch (error) {
    console.error('Ошибка инициализации моделей:', error);
    modelsLoaded = true; // Помечаем как загруженные, чтобы не повторять попытки
    return {
      wallDetection: null,
      roomSegmentation: null,
      metadataExtraction: null
    };
  }
}

/**
 * Проверяет, загружены ли модели
 */
export function areModelsLoaded() {
  return modelsLoaded && (wallDetectionModel !== null || roomSegmentationModel !== null);
}

/**
 * Получает экземпляр TensorFlow
 */
export async function getTensorFlow() {
  return await initTensorFlow();
}

/**
 * Получает загруженные модели
 */
export function getModels() {
  return {
    wallDetection: wallDetectionModel,
    roomSegmentation: roomSegmentationModel,
    metadataExtraction: metadataExtractionModel
  };
}

