/**
 * Главный модуль распознавания планов помещений
 * Объединяет обработку PDF и изображений
 */

import { 
  loadImageFromFile, 
  imageToCanvas, 
  grayscale, 
  detectEdges, 
  detectLines, 
  groupLinesIntoWalls, 
  detectRooms,
  formatWalls,
  formatRooms,
  calculateRoomArea
} from './imageProcessor.js';

// Ленивый импорт PDF процессора (загружается только при необходимости)
let pdfProcessor = null;
async function getPdfProcessor() {
  if (!pdfProcessor) {
    pdfProcessor = await import('./pdfProcessor.js');
  }
  return pdfProcessor;
}

// Ленивый импорт OCR процессора
let ocrProcessor = null;
async function getOcrProcessor() {
  if (!ocrProcessor) {
    ocrProcessor = await import('./ocrProcessor.js');
  }
  return ocrProcessor;
}

/**
 * Распознаёт план из загруженного файла
 */
export async function recognizePlan(file) {
  try {
    let image = null;
    let metadata = {};
    const fileType = file.type || file.name.split('.').pop().toLowerCase();
    
    // Обработка PDF
    if (fileType === 'pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      console.log('Обработка PDF файла...');
      
      try {
        // Ленивая загрузка PDF процессора
        const pdfModule = await getPdfProcessor();
        
        // Извлекаем изображение из PDF
        image = await pdfModule.extractImageFromPDF(file);
        
        // Пытаемся извлечь метаданные из текста
        try {
          const text = await pdfModule.extractTextFromPDF(file);
          metadata = pdfModule.parseMetadataFromText(text);
          console.log('Извлечённые метаданные:', metadata);
        } catch (error) {
          console.warn('Не удалось извлечь текст из PDF:', error);
        }
      } catch (error) {
        console.error('Ошибка при обработке PDF:', error);
        throw new Error('Не удалось обработать PDF файл. Возможно, требуется подключение к интернету для загрузки библиотеки.');
      }
    }
    // Обработка изображений (JPG, PNG)
    else if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(fileType)) {
      console.log('Обработка изображения...');
      image = await loadImageFromFile(file);
      
      // Извлекаем текст из изображения через OCR
      try {
        console.log('Распознавание текста с помощью OCR...');
        const ocrModule = await getOcrProcessor();
        const ocrText = await ocrModule.extractTextFromImage(image);
        console.log('Извлечённый текст (первые 500 символов):', ocrText.substring(0, 500));
        
        // Парсим метаданные из OCR текста
        const ocrMetadata = ocrModule.parseMetadataFromOCRText(ocrText);
        console.log('Метаданные из OCR:', ocrMetadata);
        
        // Объединяем метаданные
        metadata = {
          ...metadata,
          ...ocrMetadata,
          // Приоритет OCR метаданным
          scale: ocrMetadata.scale || metadata.scale,
          area: ocrMetadata.area || metadata.area,
          address: ocrMetadata.address || metadata.address,
          ceilingHeight: ocrMetadata.ceilingHeight || metadata.ceilingHeight
        };
      } catch (error) {
        console.warn('Не удалось выполнить OCR:', error);
        // Продолжаем без OCR
      }
    }
    else {
      throw new Error('Неподдерживаемый формат файла');
    }
    
    if (!image) {
      throw new Error('Не удалось загрузить изображение');
    }
    
    // Обрабатываем изображение
    console.log('Анализ изображения...');
    const { canvas, width, height, ctx } = imageToCanvas(image, 2048, 2048);
    
    // Применяем фильтры
    console.log('Применение фильтров...');
    grayscale(canvas, ctx);
    let edgesImageData = detectEdges(canvas, ctx);
    
    // Восстанавливаем imageData для дальнейшей обработки
    ctx.putImageData(edgesImageData, 0, 0);
    
    // Обнаруживаем линии
    console.log('Обнаружение линий...');
    const minLineLength = Math.max(40, Math.floor(Math.max(width, height) * 0.05));
    const lines = detectLines(edgesImageData, width, height, minLineLength);
    console.log(`Найдено линий: ${lines.length}`);
    
    if (lines.length === 0) {
      throw new Error('Не удалось распознать линии на плане. Попробуйте загрузить более чёткое изображение.');
    }
    
    // Группируем линии в стены
    console.log('Группировка стен...');
    const mergeDistance = Math.max(6, Math.floor(Math.max(width, height) * 0.003));
    const walls = groupLinesIntoWalls(lines, mergeDistance, mergeDistance * 1.5);
    console.log(`Найдено стен: ${walls.length}`);
    
    // Вычисляем масштаб с учётом метаданных (нужен для detectRooms)
    // Если масштаб указан в метаданных (например, 1:200), используем его
    let scale = metadata.scale || estimateScale(walls, metadata.area, null, width, height);
    
    // Если масштаб из метаданных, конвертируем (1:200 = 0.005)
    if (metadata.scale && metadata.scale > 0.001 && metadata.scale < 0.1) {
      scale = metadata.scale;
      console.log(`Используется масштаб из метаданных: ${scale} (1 пиксель = ${scale} метров)`);
    } else {
      console.log(`Определённый масштаб: ${scale} (1 пиксель = ${scale} метров)`);
    }
    
    // Обнаруживаем комнаты (с учётом масштаба для фильтрации)
    console.log('Обнаружение комнат...');
    let rooms = detectRooms(walls, width, height, scale);
    console.log(`Найдено комнат: ${rooms.length}`);
    
    // Если есть комнаты из OCR, сопоставляем их с геометрическими
    if (metadata.rooms && metadata.rooms.length > 0 && rooms.length > 0) {
      try {
        const ocrModule = await getOcrProcessor();
        const matchedRooms = ocrModule.matchRoomsWithGeometry(metadata.rooms, rooms);
        console.log('Сопоставленные комнаты:', matchedRooms);
        
        // Обновляем комнаты с номерами из OCR
        rooms = matchedRooms.map(matched => {
          if (matched.matched && matched.number) {
            // Используем номер и площадь из OCR, сохраняем isLivingRoom
            return {
              ...matched,
              name: `Комната ${matched.number}`,
              area: matched.ocrArea || matched.area,
              // Сохраняем isLivingRoom из геометрической комнаты
              isLivingRoom: matched.isLivingRoom !== false
            };
          } else {
            // Оставляем геометрическую комнату без номера, сохраняем isLivingRoom
            return {
              ...matched,
              isLivingRoom: matched.isLivingRoom !== false
            };
          }
        });
      } catch (error) {
        console.warn('Не удалось сопоставить комнаты:', error);
      }
    }
    
    // Определяем тип квартиры по количеству жилых комнат
    // Приоритет: комнаты из OCR (они точно указаны на плане), затем геометрические
    let livingRoomsCount = 0;
    
    // Если есть комнаты из OCR, используем их количество (они обычно все жилые, кроме санузлов)
    if (metadata.rooms && metadata.rooms.length > 0) {
      // Фильтруем санузлы по площади (< 6 м² обычно санузлы)
      const ocrLivingRooms = metadata.rooms.filter(r => r.area >= 6);
      livingRoomsCount = ocrLivingRooms.length;
      console.log(`Найдено жилых комнат из OCR: ${livingRoomsCount} (всего комнат: ${metadata.rooms.length})`);
    } else {
      // Если нет OCR, используем геометрические комнаты
      const livingRooms = rooms.filter(r => r.isLivingRoom !== false);
      livingRoomsCount = livingRooms.length;
      console.log(`Найдено жилых комнат из геометрии: ${livingRoomsCount}`);
    }
    
    // Если всё ещё нет жилых комнат, но есть геометрические комнаты, считаем их жилыми
    if (livingRoomsCount === 0 && rooms.length > 0) {
      console.warn('Не найдено жилых комнат, считаем все найденные комнаты жилыми');
      livingRoomsCount = rooms.length;
    }
    
    const apartmentType = determineApartmentTypeByCount(livingRoomsCount);
    console.log(`Определён тип квартиры: ${apartmentType} (жилых комнат: ${livingRoomsCount})`);
    
    // Форматируем результат
    const roomsText = formatRooms(rooms, scale);
    const wallsText = formatWalls(walls, scale);
    
    // Вычисляем общую площадь, если не указана
    let area = metadata.area;
    if (!area && rooms.length > 0) {
      area = rooms.reduce((sum, room) => {
        return sum + calculateRoomArea(room.vertices, scale);
      }, 0).toFixed(1);
    }
    
    // Подсчитываем жилые комнаты для статистики
    const livingRoomsForStats = rooms.filter(r => r.isLivingRoom !== false);
    
    return {
      success: true,
      rooms: roomsText,
      walls: wallsText,
      area: area ? String(area) : null,
      ceilingHeight: metadata.ceilingHeight ? String(metadata.ceilingHeight) : null,
      address: metadata.address || null,
      apartmentType: apartmentType,
      stats: {
        roomsFound: rooms.length,
        livingRoomsFound: livingRoomsCount || livingRoomsForStats.length,
        wallsFound: walls.length,
        linesFound: lines.length
      }
    };
    
  } catch (error) {
    console.error('Ошибка распознавания:', error);
    return {
      success: false,
      error: error.message || 'Неизвестная ошибка при распознавании плана'
    };
  }
}

/**
 * Оценивает масштаб изображения (пиксели → метры)
 * Улучшенная эвристика с учётом размера изображения и реальных данных
 */
function estimateScale(walls, knownArea = null, providedScale = null, width = null, height = null) {
  if (providedScale && providedScale > 0 && providedScale < 0.1) {
    return providedScale; // Используем предоставленный масштаб (например, 0.005 для 1:200)
  }
  
  if (walls.length === 0) return 0.005; // По умолчанию для масштаба 1:200
  
  // Вычисляем длины всех стен в пикселях
  const lengths = walls.map(wall => {
    return Math.sqrt(
      Math.pow(wall.end.x - wall.start.x, 2) + 
      Math.pow(wall.end.y - wall.start.y, 2)
    );
  }).filter(l => l > 20); // Игнорируем очень короткие стены
  
  if (lengths.length === 0) return 0.005;
  
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const maxLength = Math.max(...lengths);
  const medianLength = lengths.sort((a, b) => a - b)[Math.floor(lengths.length / 2)];
  
  // Для типовых квартир в масштабе 1:200:
  // - Средняя стена ~3-4 метра = 600-800 пикселей при 1:200
  // - Максимальная стена (внешняя) ~6-8 метров = 1200-1600 пикселей
  // - Масштаб 1:200 означает: 1 метр = 5 пикселей, или 1 пиксель = 0.2 метра при 100% масштабе
  // Но на отсканированном изображении это зависит от разрешения
  
  // Предполагаем типичные размеры для квартир
  const assumedAvgMeters = 3.5;
  const assumedMaxMeters = 7;
  
  let scaleFromAvg = assumedAvgMeters / avgLength;
  let scaleFromMax = assumedMaxMeters / maxLength;
  let scaleFromMedian = assumedAvgMeters / medianLength;
  
  // Усредняем оценки (больше доверяем медиане)
  let scale = (scaleFromAvg * 0.3 + scaleFromMax * 0.2 + scaleFromMedian * 0.5);
  
  // Корректируем по известной площади, если есть
  if (knownArea && width && height) {
    const totalPixels = width * height;
    const scaleFromArea = Math.sqrt(parseFloat(knownArea) / totalPixels);
    // Если площадь известна, больше доверяем ей
    scale = (scale * 0.2 + scaleFromArea * 0.8);
  }
  
  // Ограничиваем разумными пределами для масштаба 1:200 - 1:100
  // 1:200 = 0.005, 1:100 = 0.01
  return Math.max(0.004, Math.min(0.02, scale));
}

/**
 * Определяет тип квартиры по количеству жилых комнат
 */
function determineApartmentType(livingRooms) {
  const count = livingRooms.length;
  return determineApartmentTypeByCount(count);
}

/**
 * Определяет тип квартиры по количеству жилых комнат (число)
 */
function determineApartmentTypeByCount(count) {
  if (count === 0) {
    return 'Студия';
  } else if (count === 1) {
    return '1-комнатная';
  } else if (count === 2) {
    return '2-комнатная';
  } else if (count === 3) {
    return '3-комнатная';
  } else {
    return '3+ комнатная';
  }
}

