/**
 * OCR обработка изображений планов для извлечения текста
 * Использует Tesseract.js для распознавания текста
 */

let tesseract = null;

/**
 * Ленивая инициализация Tesseract
 */
async function initTesseract() {
  if (tesseract) return tesseract;
  
  try {
    tesseract = await import('tesseract.js');
    return tesseract;
  } catch (error) {
    console.error('Ошибка загрузки Tesseract.js:', error);
    throw new Error('Не удалось загрузить библиотеку OCR');
  }
}

/**
 * Извлекает текст из изображения с помощью OCR
 */
export async function extractTextFromImage(image) {
  try {
    const tesseractModule = await initTesseract();
    const { createWorker } = tesseractModule.default || tesseractModule;
    
    const worker = await createWorker('rus+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    try {
      // Конвертируем Image в canvas для OCR
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      
      // Распознаём текст
      const { data: { text } } = await worker.recognize(canvas);
      
      await worker.terminate();
      
      return text;
    } catch (error) {
      await worker.terminate();
      throw error;
    }
  } catch (error) {
    console.error('Ошибка OCR:', error);
    return '';
  }
}

/**
 * Парсит метаданные из OCR текста
 * Извлекает: номера комнат с площадями, адрес, масштаб, высоту потолков
 */
export function parseMetadataFromOCRText(text) {
  const metadata = {
    rooms: [], // [{ number: '22', area: 10.9, x: 100, y: 200 }]
    area: null,
    address: null,
    ceilingHeight: null,
    scale: null,
    apartmentNumber: null,
    floor: null
  };
  
  // Поиск масштаба
  const scalePatterns = [
    /масштаб[:\s]*(\d+)[:\s]*:[\s]*(\d+)/gi,
    /(\d+)[:\s]*:[\s]*(\d+)\s*масштаб/gi,
    /(\d+)[:\s]*:[\s]*(\d+)/gi
  ];
  
  for (const pattern of scalePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parts = match[0].replace(/[^\d:]/g, '').split(':');
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (den > 0) {
          metadata.scale = num / den;
          break;
        }
      }
    }
  }
  
  // Поиск номера квартиры
  const apartmentPatterns = [
    /квартир[аы]*\s*№?\s*(\d+)/gi,
    /кв\.?\s*№?\s*(\d+)/gi,
    /№\s*(\d+)/gi
  ];
  
  for (const pattern of apartmentPatterns) {
    const match = text.match(pattern);
    if (match) {
      metadata.apartmentNumber = match[1];
      break;
    }
  }
  
  // Поиск этажа
  const floorPatterns = [
    /(\d+)\s*этаж/gi,
    /этаж[:\s]*(\d+)/gi
  ];
  
  for (const pattern of floorPatterns) {
    const match = text.match(pattern);
    if (match) {
      metadata.floor = parseInt(match[1]);
      break;
    }
  }
  
  // Поиск адреса
  const addressPatterns = [
    /ул\.?\s*[А-ЯЁ][а-яё]+[,\s]+№?\s*\d+/gi,
    /по\s+ул\.?\s*[А-ЯЁ][а-яё]+[,\s]+№?\s*\d+/gi,
    /г\.?\s*[А-ЯЁ][а-яё]+[,\s]+(ул\.?|улица|пр\.?|проспект)[\sА-ЯЁа-яё\d.,]+/gi
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match && match[0].length > 10) {
      metadata.address = match[0].trim().replace(/^по\s+/, '');
      break;
    }
  }
  
  // Поиск высоты потолков (H=2.83, h=2.53)
  // Приоритет: заглавная H (основная высота) > строчная h (локальная высота)
  const heightPatterns = [
    /H\s*[=:]\s*(\d+[.,]\d+|\d+)/g, // Заглавная H (основная высота) - приоритет
    /h\s*[=:]\s*(\d+[.,]\d+|\d+)/g, // Строчная h (локальная высота)
    /высота[:\s]+(\d+[.,]\d+|\d+)\s*м/gi,
    /потол[ки]*[:\s]+(\d+[.,]\d+|\d+)\s*м/gi
  ];
  
  const heights = [];
  let mainHeight = null; // Основная высота (H=)
  
  // Сначала ищем основную высоту (H=)
  const mainHeightPattern = /H\s*[=:]\s*(\d+[.,]\d+|\d+)/g;
  let mainMatch;
  while ((mainMatch = mainHeightPattern.exec(text)) !== null) {
    const heightStr = mainMatch[1].replace(',', '.');
    const height = parseFloat(heightStr);
    if (height > 2 && height < 5) {
      mainHeight = height;
      break; // Берём первую найденную основную высоту
    }
  }
  
  // Если нашли основную высоту, используем её
  if (mainHeight !== null) {
    metadata.ceilingHeight = mainHeight.toFixed(2);
  } else {
    // Иначе ищем другие варианты
    for (const pattern of heightPatterns.slice(1)) { // Пропускаем первый паттерн (H=)
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const heightStr = (match[1] || match[0].replace(/[^\d.,]/g, '')).replace(',', '.');
        const height = parseFloat(heightStr);
        if (height > 2 && height < 5) {
          heights.push(height);
        }
      }
    }
    
    // Берём максимальную высоту (обычно это основная), если не нашли H=
    if (heights.length > 0) {
      const maxHeight = Math.max(...heights);
      metadata.ceilingHeight = maxHeight.toFixed(2);
    }
  }
  
  // Поиск комнат с площадями (формат: "22 / 10.9" или "22\n10.9" или просто "22" и рядом "10.9")
  // Также ищем паттерны типа "21/18.2", "24/12.9"
  const roomPatterns = [
    /(\d{1,2})[\s\/]+(\d+[.,]\d+|\d+)/g, // "22 / 10.9" или "22/10.9"
    /(\d{1,2})\s*\n\s*(\d+[.,]\d+|\d+)/g, // "22\n10.9"
    /комнат[аы]*\s*(\d+)[\s\/]+(\d+[.,]\d+|\d+)/gi,
    // Паттерн для формата "номер/площадь" без пробелов
    /(\d{1,2})\/(\d+[.,]\d+)/g
  ];
  
  const foundRooms = new Map();
  
  for (const pattern of roomPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const roomNumber = match[1];
      const areaStr = match[2].replace(',', '.');
      const area = parseFloat(areaStr);
      
      // Проверяем разумность данных (номер комнаты обычно 1-99, площадь 0.5-100 м²)
      if (parseInt(roomNumber) >= 1 && parseInt(roomNumber) <= 99 && 
          area > 0.5 && area < 100 && !foundRooms.has(roomNumber)) {
        foundRooms.set(roomNumber, area);
      }
    }
  }
  
  // Также ищем отдельные номера комнат и площади рядом (вертикальное расположение)
  // Паттерн: число (номер) и через несколько символов/перенос строки другое число (площадь)
  const separatePattern = /(\d{1,2})[\s\n\r]+(\d+[.,]\d+|\d+)/g;
  const separateMatches = text.matchAll(separatePattern);
  
  for (const match of separateMatches) {
    const num1 = parseInt(match[1]);
    const num2 = parseFloat(match[2].replace(',', '.'));
    
    // Если первое число маленькое (номер комнаты 1-99) и второе похоже на площадь
    if (num1 >= 1 && num1 <= 99 && num2 > 0.5 && num2 < 100) {
      const roomNum = String(num1);
      if (!foundRooms.has(roomNum)) {
        foundRooms.set(roomNum, num2);
      }
    }
  }
  
  // Дополнительный поиск: ищем пары "число-число" где первое может быть номером, второе - площадью
  // Учитываем, что на планах часто номер комнаты и площадь расположены близко
  const contextPattern = /(\d{1,2})[^\d]{0,10}(\d+[.,]\d+)/g;
  let contextMatch;
  while ((contextMatch = contextPattern.exec(text)) !== null) {
    const num1 = parseInt(contextMatch[1]);
    const num2 = parseFloat(contextMatch[2].replace(',', '.'));
    
    // Проверяем, что это не часть другого числа (например, не "12.5" где 12 - это часть)
    const afterMatch = text.substring(contextMatch.index + contextMatch[0].length, 
                                       contextMatch.index + contextMatch[0].length + 5);
    
    // Если после второго числа есть "м²" или пробел, это площадь
    if (num1 >= 1 && num1 <= 99 && num2 > 0.5 && num2 < 100 && 
        (afterMatch.includes('м') || afterMatch.includes('м²') || afterMatch.trim().length === 0)) {
      const roomNum = String(num1);
      if (!foundRooms.has(roomNum)) {
        foundRooms.set(roomNum, num2);
      }
    }
  }
  
  // Преобразуем в массив и фильтруем нереалистичные номера
  // Номера комнат обычно в диапазоне 1-30 для квартир
  metadata.rooms = Array.from(foundRooms.entries())
    .filter(([number, area]) => {
      const num = parseInt(number);
      // Фильтруем номера > 30 (это могут быть размеры или другие числа)
      // И проверяем, что площадь разумная
      return num >= 1 && num <= 30 && area > 0.5 && area < 100;
    })
    .map(([number, area]) => ({
      number: number,
      area: area
    }))
    .sort((a, b) => parseInt(a.number) - parseInt(b.number)); // Сортируем по номеру
  
  // Вычисляем общую площадь
  if (metadata.rooms.length > 0) {
    const totalArea = metadata.rooms.reduce((sum, room) => sum + room.area, 0);
    metadata.area = totalArea.toFixed(1);
  }
  
  return metadata;
}

/**
 * Сопоставляет найденные комнаты из OCR с геометрическими комнатами
 * Использует площади для сопоставления
 */
export function matchRoomsWithGeometry(ocrRooms, geometryRooms) {
  const matched = [];
  const usedGeometryIndices = new Set();
  const usedOcrIndices = new Set();
  
  // Сортируем OCR комнаты по площади (от больших к маленьким)
  const sortedOcrRooms = [...ocrRooms].map((r, i) => ({ ...r, index: i }))
    .sort((a, b) => b.area - a.area);
  
  // Сортируем геометрические комнаты по площади
  const sortedGeometryRooms = [...geometryRooms].map((r, i) => ({ ...r, index: i }))
    .sort((a, b) => b.area - a.area);
  
  // Сопоставляем по площади (с допуском 30% для учёта погрешностей OCR и геометрии)
  for (const ocrRoom of sortedOcrRooms) {
    let bestMatch = null;
    let bestDiff = Infinity;
    
    for (const geoRoom of sortedGeometryRooms) {
      if (usedGeometryIndices.has(geoRoom.index)) continue;
      
      const areaDiff = Math.abs(ocrRoom.area - geoRoom.area);
      const tolerance = Math.max(ocrRoom.area * 0.3, 1.0); // 30% допуск, минимум 1 м²
      
      if (areaDiff <= tolerance && areaDiff < bestDiff) {
        bestMatch = geoRoom;
        bestDiff = areaDiff;
      }
    }
    
    if (bestMatch) {
      matched.push({
        ...bestMatch,
        number: ocrRoom.number,
        ocrArea: ocrRoom.area,
        matched: true,
        // Сохраняем isLivingRoom из геометрической комнаты
        isLivingRoom: bestMatch.isLivingRoom !== false
      });
      usedGeometryIndices.add(bestMatch.index);
      usedOcrIndices.add(ocrRoom.index);
    }
  }
  
  // Добавляем оставшиеся геометрические комнаты без номеров
  for (const geoRoom of sortedGeometryRooms) {
    if (!usedGeometryIndices.has(geoRoom.index)) {
      matched.push({
        ...geoRoom,
        number: null,
        matched: false,
        // Сохраняем isLivingRoom из геометрической комнаты
        isLivingRoom: geoRoom.isLivingRoom !== false
      });
    }
  }
  
  // Добавляем оставшиеся OCR комнаты без геометрии (для информации)
  for (const ocrRoom of sortedOcrRooms) {
    if (!usedOcrIndices.has(ocrRoom.index)) {
      console.warn(`Комната ${ocrRoom.number} (${ocrRoom.area} м²) из OCR не найдена в геометрии`);
    }
  }
  
  return matched;
}

