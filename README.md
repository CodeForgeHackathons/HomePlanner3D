# HomePlanner3D — цифровой помощник перепланировки

HomePlanner3D объединяет распознавание планов, проверку норм и интерактивную 2.5D/3D визуализацию. Пользователь загружает техпаспорт/эскиз, система автоматически строит геометрию, предлагает правки и генерирует данные для подачи в БТИ.

```
[Файл плана] → [Клиент (Vue)] → [ML & OCR распознавание] → [GraphQL API] → [База проектов]
                                               ↓
                                         [Unity WebGL конструктор]
```

## Содержание
- Идея и сценарии использования
- Архитектура и ключевые компоненты
- Модуль распознавания планов
- Клиент (Vue + Vite)
- Unity‑модуль визуализации
- GraphQL‑сервер (Go, gqlgen, PostgreSQL)
- Формат данных проекта
- Локальная разработка и запуск
- Переменные окружения
- Тестирование и отладка
- Дорожная карта улучшений

## Идея и сценарии
- **Собственники и семьи**: быстро понять, что можно перестроить, не нарушив нормативы.
- **Архитекторы/дизайнеры**: получить черновую 3D‑сцену и список ограничений перед проектом.
- **БТИ/юристы**: получать структурированные заявки с указанием несущих стен, мокрых зон и ссылками на нормативы.
- **Игровой конструктор**: показать будущую перепланировку сверху и от первого лица, делиться ссылкой с клиентом.

## Архитектура и ключевые компоненты
| Слой | Папка | Технологии | Назначение |
|------|-------|------------|------------|
| Веб‑клиент | `client` | Vue 3, Vite, TensorFlow.js, Tesseract.js, pdfjs-dist | Загрузка планов, формы, работа с GraphQL API, запуск Unity WebGL |
| Unity | `3D/Hackaton` | Unity 2022.3.62f3, Mini First Person Controller | Построение 2.5D/3D сцены по данным распознавания, игровой конструктор |
| Сервер | `server` | Go 1.22+, gqlgen, GORM, PostgreSQL | GraphQL API, сохранение проектов, вызов AI‑помощника (YandexGPT) |
| Сборки | `client/public/Build3D` | Unity WebGL build | Встраиваемый конструктор в браузере |

## Модуль распознавания
- **Входная точка:** `client/src/utils/planRecognizer.js`.
- **ML‑пайплайн:** `mlPlanRecognizer.js` + `mlModelLoader.js`.
  - DeepLabV3+ (TensorFlow.js) для сегментации стен и комнат (`detectWallsML`, `segmentRoomsML`).
  - OCR (`ocrProcessor.js`) и PDF‑парсинг (`pdfProcessor.js`) для извлечения текста (адрес, площади, высоты).
- **Алгоритмические утилиты:** `imageProcessor.js` — обработка изображений (градации серого, выделение контуров, группировка линий). Сейчас выступает вспомогательным модулем; может использоваться как fallback.
- **Результат:** списки комнат/стен, метаданные плана и файл в Base64 для отправки в API.

## Клиент (Vue + Vite)
- Стек: Vue 3 + `<script setup>`, Vite (rolldown), PostCSS, Pinia отсутствует — состояние в `App.vue`.
- `client/src/App.vue`:
  - Лендинг и CTA.
  - Форма intake (адрес, площадь, ограничения, файл плана).
  - Модальные окна с описанием процесса.
  - Встроенные страницы `AccountPage.vue`, `ChatPage.vue`, `ConstructorPage.vue`.
- `client/src/utils/graphqlClient.js`:
  - Универсальный `graphqlRequest` с поддержкой заголовков `X-User-Id`, `X-Yandex-Api-Key`, фильтров проектов.
  - Подготовленные запросы `REGISTER_MUTATION`, `GET_USER_QUERY`, `CREATE_PLANNING_PROJECT_MUTATION`, `GET_USER_PROJECTS_QUERY`.
- `client/public/Build3D`:
  - WebGL‑сборка Unity (можно обновить экспортом из `3D/Hackaton/Build`).

### Команды
```bash
cd client
npm install
npm run dev      # разработка (http://localhost:5173)
npm run build    # продакшн
npm run preview  # предпросмотр билда
```

## Unity‑модуль визуализации (`3D/Hackaton`)
- **Версия:** указана в `ProjectSettings/ProjectVersion.txt` (2022.3.62f3).
- **Сцены:** базовая `Assets/Scenes/SampleScene.unity`.
- **Генерация карты:** `Assets/Scripts/CreateMap.cs`
  - `SimpleMapGenerator` принимает массивы точек, соединений, окон и дверей.
  - Создаёт стены, полы, потолки, окна, двери и триггеры телепорта.
  - Публичные методы для конфигурации из инспектора или через код (`SetPoints`, `SetConnections` и т.д.).
- **Управление игроком:** Mini First Person Controller (папка `Assets/Mini First Person Controller`).
- **Телепорт через двери:** `DoorTeleportSyst.cs` (кнопка `F`, определение стороны двери и смещение).
- **Расположение объектов:** `PanelScript.cs` — горячие клавиши 1–7 для выбора пресетов, `E` — поставить, `Q` — удалить.
- **Демо‑конфигурация:** `WaiterInfo.cs` (`TestRoomWithDoors()`).

### Экспорт в WebGL
1. Откройте `3D/Hackaton` в Unity 2022.3.62f3.
2. Выберите `File → Build Settings → WebGL`.
3. Соберите в `3D/Hackaton/Build` и при необходимости скопируйте в `client/public/Build3D`.

## GraphQL‑сервер (`server`)
- **Точка входа:** `server/server.go`
  - Загружает `.env`, запускает gqlgen‑сервер на `PORT` (по умолчанию `8080`), публикует Playground на `/`.
  - Встраивает middleware `withUserIDContext` для передачи заголовков в контекст резолверов.
- **БД:** PostgreSQL, подключение через GORM (`internal/db/db.go`). DSN можно вынести в переменные окружения.
- **Схема:** `graph/schema.graphqls`
  - `Mutation`: `register`, `createPlanningProject`.
  - `Query`: `getUser`, `getUserProject`, `getUserProjects`.
  - Типы: `Plan`, `Geometry`, `Room`, `Wall`, `Constraints`, `PlanFile`.
- **Модели:** `internal/models/*.go` — Users, Projects, Walls, Rooms, Vertices, Constraints, AIAnalysis.
- **AI помощник:** `graph/assistant/bti_analyzer.go`
  - Вызов YandexGPT (через IAM‑токен или заголовок `X-Yandex-Api-Key`).
  - Ожидает JSON `{ is_valid, decision, justification, ... }`.
  - При ошибке — fallback с решением `"pending"`.
- **Resolvers:** `graph/schema.resolvers.go`
  - `createPlanningProject` собирает промпт для AI, требует `X-User-Id`, сохраняет проект и связанные сущности.
  - `getUserProjects` поддерживает фильтрацию по заголовкам `X-Only-Approved`, `X-Projects-Filter`.

### Запуск сервера
```bash
cd server
go mod download
cp .env.example .env   # создайте при необходимости
go run ./server
# Сервер слушает http://localhost:8080/query
```

## Формат данных проекта
Клиент отправляет `PlanningProjectInput` (см. `graph/schema.graphqls`). Основные блоки:
- `plan`: адрес, площадь, источник документа, тип квартиры, профиль семьи, цель, свободный текст пожеланий, высоты, статус распознавания, файл (имя/размер/тип/контент в Base64).
- `geometry.rooms`: список комнат с вершинами (x/y) и высотой.
- `walls`: сегменты с координатами начала/конца, несущестью, толщиной, типом.
- `constraints`: массивы `forbiddenMoves` и `regionRules`.
- `clientTimestamp`: ISO‑8601 строка (опционально).

Пример JSON:
```json
{
  "plan": {
    "address": "Москва, ул. Примерная, д. 1",
    "area": 70,
    "source": "PDF / техпаспорт",
    "layoutType": "2-комнатная",
    "familyProfile": "Семья с ребёнком",
    "goal": "Больше света и рабочее место",
    "prompt": "Объединить кухню и гостиную",
    "ceilingHeight": 2.7,
    "floorDelta": 0,
    "recognitionStatus": "success",
    "file": { "name": "plan.pdf", "size": 123456, "type": "application/pdf" }
  },
  "geometry": {
    "rooms": [
      {
        "id": "R1",
        "name": "Комната 1",
        "height": 2.7,
        "vertices": [
          { "x": 0, "y": 0 },
          { "x": 5.2, "y": 0 },
          { "x": 5.2, "y": 4.1 },
          { "x": 0, "y": 4.1 }
        ]
      }
    ]
  },
  "walls": [
    {
      "id": "W1",
      "start": { "x": 0, "y": 0 },
      "end": { "x": 5.2, "y": 0 },
      "loadBearing": true,
      "thickness": 0.2,
      "wallType": "несущая"
    }
  ],
  "constraints": {
    "forbiddenMoves": ["нельзя переносить кухню над жилой"],
    "regionRules": ["СНиП 31-02", "ЖК РФ ст.25"]
  },
  "clientTimestamp": "2025-11-29T00:00:00.000Z"
}
```

## Локальная разработка и запуск
1. **Подготовьте окружение**
   - Node.js ≥ 20 / npm ≥ 10.
   - Go ≥ 1.22.
   - PostgreSQL ≥ 14.
   - Unity Hub + Unity 2022.3.62f3.
2. **Склонируйте репозиторий**
   ```bash
   git clone <repo>
   cd HomePlanner3D
   ```
3. **Настройте `.env`**
   - `server/.env`: `PORT`, `YANDEX_CLOUD_API_KEY`, DSN к PostgreSQL.
   - `client/.env`: `VITE_GRAPHQL_ENDPOINT`, `VITE_ENABLE_PROJECT_API`, `VITE_BTI_PROMPT_LIMIT`.
4. **Запустите сервер**
   ```bash
   cd server
   go run ./server
   ```
5. **Запустите клиент**
   ```bash
   cd client
   npm run dev
   ```
6. **Unity**
   - Откройте `3D/Hackaton` в Unity.
   - Для веба используйте готовую сборку или обновите `client/public/Build3D`.

## Переменные окружения
### Клиент
- `VITE_GRAPHQL_ENDPOINT` — адрес GraphQL (по умолчанию `/query`).
- `VITE_ENABLE_PROJECT_API` — `true/false`, отправлять ли данные на сервер.
- `VITE_BTI_PROMPT_LIMIT` — максимальная длина текста, отправляемого в AI.

### Сервер
- `PORT` — порт HTTP.
- `DATABASE_URL` (рекомендуется) или жёстко прописанный DSN в `internal/db/db.go`.
- `YANDEX_CLOUD_API_KEY` — IAM‑токен для YandexGPT.

## Тестирование и отладка
- **Клиент**: Vite dev server + devtools; проверка GraphQL ошибок в консоли, в `graphqlClient.js` предусмотрены детальные сообщения при HTML‑ответе.
- **Сервер**: Playground на `http://localhost:8080/`, логи AI‑запросов (`log.Printf`). Для unit‑тестов можно добавить пакеты в `server/internal`.
- **Unity**: Play Mode + `Debug.Log` в скриптах генерации; проверяйте слои `Doors`, теги `Floor/Ceiling`.

## Дорожная карта улучшений
- Вынести параметры подключения к БД в `.env`, использовать `DATABASE_URL`.
- Вернуть алгоритмический fallback распознавания при недоступности ML‑моделей.
- Добавить полноценную авторизацию (JWT или OAuth) вместо ручного `X-User-Id`.
- Сохранять результаты AI‑анализа (`AIAnalysis`) и показывать их в клиенте.
- Ограничить размер загружаемых файлов и хранить бинарные данные вне основной БД.
- Автоматизировать экспорт Unity WebGL и интеграционные тесты клиент ↔ Unity.

## Лицензия
Проект распространяется на условиях **HomePlanner3D Personal-Use License (HPL-PU)** (`LICENSE`).  
Она разрешает бесплатное использование, модификацию и распространение только для личных/некоммерческих целей. Любое коммерческое применение (продажа, SaaS, включение в платные продукты) запрещено без письменного согласия правообладателя.

---
Проект открыт к доработкам: присылайте PR, создавайте задачи по улучшениям и расширениям функциональности. При изменении API обязательно обновляйте этот README.
