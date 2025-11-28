<template>
  <div class="page">
    <header class="hero">
      <div class="hero__content">
        <p class="hero__badge">HomePlanner3D · цифровой помощник перепланировки</p>
        <h1>
          HomePlanner3D — перепланируйте уверенно, легально и наглядно
        </h1>
        <p class="hero__subtitle">
          Загрузите техпаспорт или эскиз, мгновенно получите 2.5D план, вид от
          первого лица, проверку СНиПов и AI-сценарии. Вся 3D-сцена строится
          автоматически по данным, которые мы собираем, а визуализацией занимается
          партнёр-команда.
        </p>
        <div class="hero__actions">
          <button class="btn btn--primary">Загрузить план</button>
          <button class="btn btn--ghost">Посмотреть примеры</button>
        </div>
      </div>
      <div class="hero__visual">
        <div class="visual-card">
          <h3>Сценарий «Семейная 70 м²»</h3>
          <p>+1 спальня · +15% естественного света</p>
          <div class="visual-card__plan">
            <span>До</span>
            <span>После</span>
          </div>
        </div>
      </div>
    </header>

    <section class="flow">
      <h2>Как это работает</h2>
      <p class="flow__subtitle">
        Пять шагов от загрузки техпаспорта до заявки в БТИ: распознаём, даём
        конструктор, проверяем, предлагаем AI-варианты и подключаем экспертов.
      </p>
      <div class="flow__steps">
        <article v-for="(step, index) in steps" :key="step.title" class="step">
          <div class="step__number">{{ index + 1 }}</div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
          <a class="step__link" href="#">Узнать больше</a>
        </article>
      </div>
    </section>

    <section class="recognition">
      <div class="recognition__text">
        <h2>Распознаём планы любой сложности</h2>
        <p>
          Поддерживаем PDF, фото со смартфона и BIM-файлы. Алгоритм чистит шум,
          определяет помещения и мебель, достигая до 94% точности.
        </p>
        <ul>
          <li>Автоматическое определение стен, дверей и мокрых зон</li>
          <li>Экспорт в DWG, SVG и интерактивный 3D</li>
          <li>История версий и совместная работа с архитектором</li>
        </ul>
        <button class="btn btn--primary btn--small">
          Показать полный кейс
        </button>
      </div>
      <div class="recognition__preview">
        <div class="preview-card">
          <p>До</p>
          <div class="preview-card__plan preview-card__plan--raw"></div>
        </div>
        <div class="preview-card">
          <p>После</p>
          <div class="preview-card__plan preview-card__plan--clean"></div>
        </div>
      </div>
    </section>

    <section class="builder">
      <div class="section-header">
        <h2>Игровой конструктор HomePlanner3D</h2>
        <p>
          Мы собираем структурированные данные (геометрия, стены, ограничения) и
          отдаём их в Unity-скрипт напарника. Пользователь видит 2.5D план, режим
          “от первого лица”, может сносить стены, добавлять перегородки и расставлять
          базовую мебель.
        </p>
      </div>
      <div class="builder__grid">
        <article
          v-for="tool in builderTools"
          :key="tool.title"
          class="builder-card"
        >
          <h3>{{ tool.title }}</h3>
          <p>{{ tool.description }}</p>
        </article>
      </div>
      <div class="builder__modes">
        <article v-for="mode in builderModes" :key="mode.title" class="mode-card">
          <h3>{{ mode.title }}</h3>
          <p>{{ mode.description }}</p>
        </article>
      </div>
    </section>

    <section class="checks">
      <div class="section-header">
        <h2>Моментальная проверка норм и рисков</h2>
        <p>
          Каждый сценарий проходит автоматические правила: несущие стены,
          вентиляция, перенос мокрых зон и пожарные требования.
        </p>
      </div>
      <div class="checks__list">
        <article v-for="check in checks" :key="check.title" class="check-card">
          <div class="status" :class="`status--${check.status}`">
            {{ check.statusLabel }}
          </div>
          <h3>{{ check.title }}</h3>
          <p>{{ check.description }}</p>
        </article>
      </div>
      <button class="btn btn--ghost">Получить отчёт по нормам</button>
    </section>

    <section class="gallery">
      <div class="section-header">
        <h2>Готовые варианты перепланировок</h2>
        <p>Выберите по типу квартиры, целям и доступному бюджету.</p>
      </div>
      <div class="gallery__filters">
        <button class="chip chip--active">Метраж 35–80 м²</button>
        <button class="chip">Семья с детьми</button>
        <button class="chip">Рабочий кабинет</button>
        <button class="chip">Экономия бюджета</button>
      </div>
      <div class="gallery__grid">
        <article
          v-for="scenario in scenarios"
          :key="scenario.title"
          class="scenario-card"
        >
          <div class="scenario-card__visual"></div>
          <h3>{{ scenario.title }}</h3>
          <p>{{ scenario.description }}</p>
          <span class="scenario-card__tag">{{ scenario.benefit }}</span>
        </article>
      </div>
    </section>

    <section class="ai">
      <div class="section-header">
        <h2>AI-варианты перепланировки</h2>
        <p>
          Генеративный модуль создаёт 3–5 сценариев на основе ваших целей и набора
          ограничений. Каждый вариант проверяется нормами до того, как попадает в
          конструктор.
        </p>
      </div>
      <div class="ai__grid">
        <article v-for="variant in aiVariants" :key="variant.title" class="ai-card">
          <div class="ai-card__badge">{{ variant.focus }}</div>
          <h3>{{ variant.title }}</h3>
          <p>{{ variant.description }}</p>
          <ul>
            <li v-for="point in variant.points" :key="point">{{ point }}</li>
          </ul>
        </article>
      </div>
      <button class="btn btn--primary btn--small">Запросить варианты AI</button>
    </section>

    <section class="demo">
      <div class="demo__media"></div>
      <div class="demo__content">
        <h2>Интерактивная 3D и AR визуализация</h2>
        <p>
          Посмотрите, как меняются стены и мебель в реальном времени. Сцену
          рендерит отдельный Unity-скрипт напарника, которому мы передаём всю
          геометрию и ограничения. Делитесь режимом сверху и прогулкой от первого
          лица с семьёй или архитектором.
        </p>
        <button class="btn btn--primary">Попробовать демо</button>
      </div>
    </section>

    <section class="testimonials">
      <h2>Нам доверяют мастера и жильцы</h2>
      <div class="testimonials__list">
        <article
          v-for="testimonial in testimonials"
          :key="testimonial.author"
          class="testimonial-card"
        >
          <p class="testimonial-card__text">“{{ testimonial.quote }}”</p>
          <p class="testimonial-card__author">
            {{ testimonial.author }} · {{ testimonial.type }}
          </p>
        </article>
      </div>
    </section>

    <section class="experts">
      <div class="experts__content">
        <h2>Подключение экспертов БТИ</h2>
        <p>
          Когда сценарий устроил пользователя и прошёл проверки, он оставляет
          заявку на оформление документации и выезд специалиста. Мы передаём весь
          пакет данных и чертежей в БТИ без повторного ввода.
        </p>
        <ul>
          <li v-for="channel in expertChannels" :key="channel">
            {{ channel }}
          </li>
        </ul>
      </div>
      <form class="experts__form">
        <label>
          Имя и город
          <input type="text" placeholder="Мария, Москва" />
        </label>
        <label>
          Контакт
          <input type="text" placeholder="@telegram или телефон" />
        </label>
        <label>
          Комментарий
          <textarea placeholder="Квартира 62 м², нужен проект перепланировки"></textarea>
        </label>
        <button type="button" class="btn btn--primary">Отправить заявку</button>
      </form>
    </section>

    <section class="bti">
      <div class="section-header">
        <h2>Зачем это БТИ</h2>
        <p>
          HomePlanner3D превращает БТИ в digital-сервис: приводит горячих клиентов,
          повышает доверие и открывает подписочную монетизацию.
        </p>
      </div>
      <div class="bti__grid">
        <article v-for="benefit in btiBenefits" :key="benefit.title" class="bti-card">
          <h3>{{ benefit.title }}</h3>
          <p>{{ benefit.description }}</p>
        </article>
      </div>
    </section>

    <section class="faq">
      <div class="section-header">
        <h2>Частые вопросы и согласования</h2>
        <p>Прозрачно рассказываем о сроках, правах и безопасности данных.</p>
      </div>
      <div class="faq__list">
        <article v-for="item in faq" :key="item.question" class="faq-card">
          <h3>{{ item.question }}</h3>
          <p>{{ item.answer }}</p>
        </article>
      </div>
      <div class="faq__actions">
        <button class="btn btn--ghost">Скачать гид по перепланировке</button>
        <button class="btn btn--primary btn--small">Чат с экспертом</button>
      </div>
    </section>

    <footer class="footer">
      <div>
        <p class="footer__brand">HomePlanner3D — Планировщик ремонта</p>
        <p>Цифровой помощник перепланировки. Прототип для хакатона.</p>
      </div>
      <div class="footer__links">
        <a href="#">Контакты</a>
        <a href="#">Telegram</a>
        <a href="#">Политика</a>
      </div>
    </footer>
  </div>
</template>

<script setup>
const steps = [
  {
    title: 'Распознаём план',
    description:
      'Загрузите PDF, DWG или фото — алгоритм строит точную геометрию и сетку помещений.',
  },
  {
    title: 'Конструктор 2.5D/FPV',
    description:
      'Переходите в интерактивный редактор: сносите стены, ставьте перегородки, расставляйте мебель.',
  },
  {
    title: 'Автопроверки норм',
    description:
      'Каждое действие сверяется с СНиП, Жилищным кодексом и правилами ЖК в реальном времени.',
  },
  {
    title: 'AI генерирует варианты',
    description:
      'Получайте 3–5 сценариев зонирования с учётом целей, бюджета и ограничений.',
  },
  {
    title: 'Передаём в БТИ',
    description:
      'Отправьте заявку, и эксперты БТИ оформят проект и согласуют перепланировку.',
  },
];

const builderTools = [
  {
    title: 'Снос/перенос стен',
    description:
      'Выделяйте несущие и ненесущие стены, пробуйте безопасные проёмы и усиления.',
  },
  {
    title: 'Перегородки и зонирование',
    description: 'Добавляйте лёгкие перегородки, объединяйте и делите комнаты.',
  },
  {
    title: 'Базовая мебель',
    description:
      'Расставляйте коробочные блоки кухни, диванов, кроватей, чтобы оценить эргономику.',
  },
  {
    title: 'История изменений',
    description:
      'Сохраняйте версии, сравнивайте сценарии и делитесь ссылкой с семьёй и дизайнером.',
  },
];

const builderModes = [
  {
    title: '2.5D план сверху',
    description:
      'Точный масштаб, сетка и привязки — удобно для быстрого редактирования.',
  },
  {
    title: 'Режим от первого лица',
    description:
      'Погуляйте по будущей квартире; сцену рендерит Unity-скрипт коллеги.',
  },
];

const checks = [
  {
    title: 'Несущие стены',
    description: 'Фиксируем недопустимые проёмы и рекомендуем усиление.',
    status: 'ok',
    statusLabel: 'OK',
  },
  {
    title: 'Мокрые зоны',
    description:
      'Предупреждаем перенос кухонь и санузлов над жилыми комнатами.',
    status: 'warning',
    statusLabel: 'Warning',
  },
  {
    title: 'Вентиляция и дымоудаление',
    description: 'Отслеживаем перекрытие шахт и соблюдение требований СНиПов.',
    status: 'ok',
    statusLabel: 'OK',
  },
  {
    title: 'Пожарная безопасность',
    description:
      'Контролируем эвакуационные пути и соблюдение минимальных проходов.',
    status: 'info',
    statusLabel: 'Info',
  },
];

const aiVariants = [
  {
    title: 'Светлая гостиная',
    focus: 'Семья + свет',
    description: 'Кухня-гостиная с панорамным освещением и нишей под хранение.',
    points: ['Снос двух перегородок', 'Усиление проёма 1,2 м', 'AR-просмотр'],
  },
  {
    title: 'Спокойная двушка',
    focus: 'Пара + кабинет',
    description: 'Отдельный кабинет и кладовая без переноса мокрых зон.',
    points: ['Лёгкие перегородки', 'Мебель вдоль несущей', 'Вариант бюджета'],
  },
  {
    title: 'Смарт-перепланировка',
    focus: 'Инвестиция',
    description: 'Разделение на две студии с общим техблоком.',
    points: ['Контроль нагрузок', 'Звукоизоляция', 'Готовая подача в БТИ'],
  },
];

const scenarios = [
  {
    title: 'Студия 38 м²',
    description: 'Зонирование спальни и увеличение кладовой.',
    benefit: '+1 приватная зона',
  },
  {
    title: 'Семейная 70 м²',
    description: 'Увеличенная кухня-гостиная и детская.',
    benefit: '+15% света',
  },
  {
    title: 'Панельная двушка',
    description: 'Легальный проём и вынос кухни в нишу.',
    benefit: '+1 спальня',
  },
  {
    title: 'Лофт 55 м²',
    description: 'Рабочее место и гардеробная в несущем каркасе.',
    benefit: '+10 м² хранения',
  },
  {
    title: 'Сити-апартаменты',
    description: 'Умное освещение и кабинет у окна.',
    benefit: 'AR тур',
  },
  {
    title: 'Сканди навесной модуль',
    description: 'Сборные перегородки и экосвет.',
    benefit: '-20% бюджета',
  },
];

const testimonials = [
  {
    author: 'Елена, архитектор',
    type: 'архбюро «Форма»',
    quote: 'Проверки норм экономят нам часы на каждом проекте.',
  },
  {
    author: 'Игорь, владелец двушки',
    type: 'Москва',
    quote: 'Увидел три сценария за вечер и сразу выбрал лучший.',
  },
  {
    author: 'Zebra Development',
    type: 'девелопер',
    quote: 'Инструмент помог быстро согласовать перепланировки в шоу-руме.',
  },
];

const expertChannels = [
  'Выезд инженера БТИ в течение 3 дней',
  'Подготовка рабочего проекта и смет',
  'Передача пакета документов в МФЦ',
];

const btiBenefits = [
  {
    title: 'Лидогенерация',
    description: 'Клиент обращается ещё до начала ремонта и готов оформить услуги.',
  },
  {
    title: 'Новый доход',
    description: 'Базовая проверка бесплатна, расширенный функционал — по подписке.',
  },
  {
    title: 'Авторитет экспертов',
    description:
      'БТИ закрепляется как центр компетенций по ремонту и перепланировке.',
  },
  {
    title: 'Подготовленные заявки',
    description: 'Вся документация и расчёты уже структурированы и готовы к подаче.',
  },
];

const faq = [
  {
    question: 'Сколько занимает распознавание?',
    answer: 'Обычно 2–3 минуты для квартиры до 120 м², без ручной работы.',
  },
  {
    question: 'Имеет ли отчёт юридическую силу?',
    answer:
      'Да, экспортируем форматы для подачи в МФЦ или ведомства, добавляем подписи проектировщика.',
  },
  {
    question: 'Как защищены мои данные?',
    answer:
      'Все планы шифруются, хранятся в изолированном контуре и удаляются по запросу.',
  },
];
</script>

<style scoped>
:global(body) {
  margin: 0;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  background: #0b0d12;
  color: #f5f6f8;
  line-height: 1.5;
}

.page {
  padding: 32px 64px 96px;
  max-width: 1200px;
  margin: 0 auto;
}

h1,
h2,
h3 {
  margin: 0 0 12px;
  line-height: 1.2;
}

p {
  margin: 0 0 16px;
  color: #c6cad4;
}

section {
  margin-top: 72px;
}

.hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  padding: 56px;
  background: radial-gradient(circle at top left, #1f2639, #11131c);
  border-radius: 28px;
  position: relative;
  overflow: hidden;
}

.hero__content {
  max-width: 520px;
}

.hero__badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero__subtitle {
  font-size: 18px;
  color: #dfe2ea;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
}

.hero__visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-card {
  width: 100%;
  padding: 24px;
  border-radius: 20px;
  background: rgba(11, 14, 26, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.visual-card__plan {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  text-transform: uppercase;
  font-size: 13px;
  text-align: center;
}

.flow h2 {
  margin-bottom: 24px;
}

.flow__subtitle {
  margin-top: -8px;
  margin-bottom: 28px;
  color: #98a2c3;
}

.flow__steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.step {
  padding: 24px;
  border-radius: 20px;
  background: #151826;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.step__number {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #2f5dff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.step__link {
  color: #7d8bff;
  text-decoration: none;
  font-weight: 600;
}

.recognition {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  align-items: center;
}

.recognition__preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 18px;
}

.preview-card {
  padding: 16px;
  border-radius: 20px;
  background: #151826;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.preview-card__plan {
  height: 180px;
  border-radius: 14px;
  margin-top: 12px;
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.08) 75%, transparent 75%, transparent);
  background-size: 24px 24px;
}

.preview-card__plan--clean {
  background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
}

.builder__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 18px;
  margin-top: 28px;
}

.builder-card {
  padding: 20px;
  border-radius: 18px;
  background: #171b2b;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.builder__modes {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.mode-card {
  padding: 20px;
  border-radius: 18px;
  background: rgba(47, 93, 255, 0.1);
  border: 1px solid rgba(47, 93, 255, 0.25);
}

.checks__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin: 32px 0;
}

.check-card {
  padding: 20px;
  border-radius: 18px;
  background: #141821;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.status {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status--ok {
  background: rgba(76, 175, 80, 0.15);
  color: #a5ffb6;
}

.status--warning {
  background: rgba(255, 193, 7, 0.15);
  color: #ffe5a3;
}

.status--info {
  background: rgba(126, 180, 255, 0.15);
  color: #cfe0ff;
}

.gallery__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 24px 0;
}

.chip {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #dfe2ea;
  border-radius: 999px;
  padding: 8px 18px;
  cursor: pointer;
}

.chip--active {
  background: #2f5dff;
  border-color: #2f5dff;
}

.gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.scenario-card {
  padding: 18px;
  border-radius: 18px;
  background: #11131c;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.scenario-card__visual {
  height: 140px;
  border-radius: 14px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, rgba(47, 93, 255, 0.3), rgba(32, 201, 151, 0.2));
}

.scenario-card__tag {
  display: inline-block;
  margin-top: 8px;
  font-size: 13px;
  color: #9cb4ff;
}

.ai {
  margin-top: 72px;
}

.ai__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.ai-card {
  padding: 20px;
  border-radius: 18px;
  background: #151826;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.ai-card__badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  margin-bottom: 10px;
}

.ai-card ul {
  padding-left: 18px;
  margin: 12px 0 0;
  color: #c6cad4;
}

.demo {
  margin-top: 80px;
  padding: 40px;
  border-radius: 24px;
  background: radial-gradient(circle at center, #1b2336, #0b0d12);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 32px;
}

.demo__media {
  border-radius: 20px;
  background: repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 10px, transparent 10px, transparent 20px);
  min-height: 240px;
}

.testimonials__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.testimonial-card {
  padding: 20px;
  border-radius: 18px;
  background: #121421;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.testimonial-card__text {
  font-style: italic;
  color: #dfe2ea;
}

.testimonial-card__author {
  margin-top: 12px;
  color: #9aa5c1;
  font-size: 14px;
}

.experts {
  margin-top: 72px;
  padding: 40px;
  border-radius: 24px;
  background: #111423;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 32px;
}

.experts ul {
  padding-left: 18px;
  color: #c6cad4;
}

.experts__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.experts__form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #dfe2ea;
}

.experts__form input,
.experts__form textarea {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  padding: 10px;
  font-family: inherit;
}

.experts__form textarea {
  min-height: 96px;
  resize: none;
}

.bti__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.bti-card {
  padding: 20px;
  border-radius: 18px;
  background: #121523;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.faq__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin: 24px 0;
}

.faq-card {
  padding: 20px;
  border-radius: 18px;
  background: #151826;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.faq__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.footer {
  margin-top: 96px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  color: #8891ab;
  font-size: 14px;
}

.footer__brand {
  font-weight: 600;
  color: #fff;
}

.footer__links {
  display: flex;
  gap: 18px;
}

.footer__links a {
  color: inherit;
  text-decoration: none;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn:hover,
.chip:hover {
  opacity: 0.85;
}

.btn--primary {
  background: #2f5dff;
  color: #fff;
}

.btn--ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
}

.btn--small {
  padding: 10px 18px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .page {
    padding: 24px;
  }

  .hero {
    padding: 32px;
  }

  .hero__actions {
    flex-direction: column;
  }

  .footer {
    flex-direction: column;
  }
}
</style>
