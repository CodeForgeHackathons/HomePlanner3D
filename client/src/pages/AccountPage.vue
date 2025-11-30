<template>
  <section class="lk">
    <div class="lk__hero">
      <div>
        <p class="lk__eyebrow">Личный кабинет</p>
        <h1>{{ user ? 'Ваши данные и проекты' : 'Войдите, чтобы продолжить' }}</h1>
        <p>
          Здесь будут статусы распознавания, проверки норм и документы для БТИ. Авторизуйтесь, чтобы
          продолжить работу над проектом.
        </p>
      </div>
      <div class="lk__hero-actions">
        <button type="button" class="btn btn--ghost btn--small" @click="goBack">
          ← На главную
        </button>
        <button
          v-if="user"
          type="button"
          class="btn btn--ghost btn--small lk__logout"
          @click="$emit('logout')"
        >
          Выйти из аккаунта
        </button>
        <button
          v-else
          type="button"
          class="btn btn--primary btn--small"
          @click="$emit('open-auth')"
        >
          Войти
        </button>
      </div>
    </div>

    <div v-if="user" class="lk__grid">
      <article class="lk-card lk-card--accent">
        <div class="lk-card__title">
          <span>Профиль</span>
          <small>ID {{ user.id }}</small>
        </div>
        <ul class="lk-card__list">
          <li>
            <span>Логин</span>
            <strong>{{ user.login }}</strong>
          </li>
          <li v-if="user.username">
            <span>Имя</span>
            <strong>{{ user.username }}</strong>
          </li>
          <li v-if="user.email">
            <span>Email</span>
            <strong>{{ user.email }}</strong>
          </li>
          <li v-if="user.birthday">
            <span>Дата рождения</span>
            <strong>{{ formatBirthday(user.birthday) }}</strong>
          </li>
        </ul>
      </article>

      <article class="lk-card">
        <div class="lk-card__title">
          <span>Проекты</span>
          <small>{{ projects.length }} проект(ов)</small>
        </div>

        <div v-if="loadingProjects" class="lk-card__loading">
          <p>Загрузка проектов...</p>
        </div>

        <div v-else-if="projects.length === 0" class="lk-card__empty">
          <p class="lk-card__text">У вас пока нет проектов.</p>
        </div>

        <div v-else class="lk-card__projects">
          <div class="projects-scroll-container">
            <div v-for="project in projects" :key="project.id" class="project-item">
              <div class="project__header">
                <strong>Проект #{{ project.id }}</strong>
                <span class="project__status" :class="`project__status--${getStatusClass(project.status)}`">
                  {{ project.status }}
                </span>
              </div>
              <div class="project__details">
                <div v-if="project.plan?.address" class="project__detail">
                  <span>Адрес:</span>
                  <span>{{ project.plan.address }}</span>
                </div>
                <div v-if="project.plan?.area" class="project__detail">
                  <span>Площадь:</span>
                  <span>{{ project.plan.area }} м²</span>
                </div>
                <div class="project__detail">
                  <span>Создан:</span>
                  <span>{{ formatDate(project.createdAt) }}</span>
                </div>
                <div v-if="project.walls" class="project__detail">
                  <span>Стен:</span>
                  <span>{{ project.walls.length }}</span>
                </div>
              </div>
              <div class="project__actions">
                <button
                  type="button"
                  class="btn btn--ghost btn--small"
                  @click="openConstructor(project)"
                >
                  Открыть в конструкторе
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article class="lk-card">
        <div class="lk-card__title">
          <span>Эксперты и поддержка</span>
          <small>24/7</small>
        </div>
        <p class="lk-card__text">
          Команда БТИ подключится к проекту, когда вы подтвердите сценарий. До этого момента можно
          задать вопросы в чате или по телефону.
        </p>
        <div class="lk-card__actions">
          <button type="button" class="btn btn--ghost btn--small" @click="openChat">
            Чат с экспертом
          </button>
          <button type="button" class="btn btn--primary btn--small" @click="goBack">
            Запросить консультацию
          </button>
        </div>
      </article>
    </div>

    <div v-else class="lk__empty">
      <div class="lk-card lk-card--accent">
        <p class="lk-card__text">
          Пока мы не знаем, кто вы. Авторизуйтесь или зарегистрируйтесь, чтобы увидеть сохранённые
          проекты и продолжить работу.
        </p>
        <button type="button" class="btn btn--primary btn--small" @click="$emit('open-auth')">
          Войти или зарегистрироваться
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { graphqlRequest } from '../utils/graphqlClient.js'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  formatBirthday: {
    type: Function,
    default: (value) => value,
  },
});

const emit = defineEmits(['back', 'open-auth', 'logout', 'open-chat', 'open-constructor']);

const projects = ref([])
const loadingProjects = ref(false)

const GET_USER_PROJECTS_QUERY = `
  query GetUserProjects($user_id: ID!) {
    getUserProjects(user_id: $user_id) {
      id
      status
      createdAt
      clientTimestamp
      plan {
        address
        area
        source
        layoutType
        familyProfile
        goal
        prompt
        ceilingHeight
        floorDelta
        recognitionStatus
      }
      geometry {
        rooms {
          id
          name
          height
          vertices {
            x
            y
          }
        }
      }
      walls {
        id
        start {
          x
          y
        }
        end {
          x
          y
        }
        loadBearing
        thickness
        wallType
      }
      constraints {
        forbiddenMoves
        regionRules
      }
    }
  }
`

const loadProjects = async () => {
  if (!props.user?.id) {
    projects.value = []
    return
  }

  loadingProjects.value = true
  try {
    const data = await graphqlRequest(GET_USER_PROJECTS_QUERY, { user_id: String(props.user.id) })
    projects.value = Array.isArray(data?.getUserProjects) ? data.getUserProjects : []
    console.log('[Account] Loaded projects:', projects.value.length)
  } catch (error) {
    console.warn('Не удалось загрузить проекты:', error)
    projects.value = []
  } finally {
    loadingProjects.value = false
  }
}

const getStatusClass = (status) => {
  if (!status) return 'default'

  const s = String(status).toLowerCase()
  if (s.includes('ready') || s.includes('done') || s.includes('success') || s.includes('готов')) {
    return 'success'
  }
  if (s.includes('pending') || s.includes('processing') || s.includes('ожид') || s.includes('обработ')) {
    return 'pending'
  }
  if (s.includes('error') || s.includes('failed') || s.includes('ошибка')) {
    return 'error'
  }
  return 'default'
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

// Методы навигации
const goBack = () => {
  emit('back')
}

const openChat = () => {
  emit('open-chat')
}

const openConstructor = (project) => {
  emit('open-constructor', project)
}

// Загружаем проекты при монтировании и при изменении пользователя
onMounted(() => {
  if (props.user) {
    loadProjects()
  }
})

watch(() => props.user, (newUser) => {
  if (newUser) {
    loadProjects()
  } else {
    projects.value = []
  }
})
</script>

<style scoped>
.lk {
  margin: 48px auto 96px;
  max-width: 1200px;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.lk__hero {
  padding: 36px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(47, 93, 255, 0.2), rgba(32, 201, 151, 0.15));
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
}

.lk__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  margin-bottom: 6px;
  color: #d3d8ff;
}

.lk__hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.lk__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.lk__empty {
  display: flex;
  justify-content: center;
}

.lk-card {
  padding: 24px;
  border-radius: 20px;
  background: #141829;
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.lk-card--accent {
  background: rgba(20, 24, 41, 0.85);
  border-color: rgba(255, 255, 255, 0.12);
}

.lk-card__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #fff;
}

.lk-card__title small {
  font-size: 12px;
  color: #c7d3ff;
  opacity: 0.8;
}

.lk-card__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lk-card__list li {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #c6cad4;
}

.lk-card__list strong {
  color: #fff;
}

.lk-card__text {
  margin: 0;
  color: #c7cbe0;
}

.lk-card__loading {
  text-align: center;
  padding: 20px;
  color: #c7cbe0;
}

.lk-card__empty {
  text-align: center;
  padding: 10px;
  color: #c7cbe0;
}

.lk-card__projects {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}

.projects-scroll-container {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Стили для скроллбара */
.projects-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.projects-scroll-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.projects-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.projects-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.project-item {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  min-height: 120px;
}

.project__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.project__status {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.project__status--success {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.project__status--pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.project__status--error {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.project__status--default {
  background: rgba(158, 158, 158, 0.2);
  color: #9e9e9e;
}

.project__details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.project__detail {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #c7cbe0;
}

.project__detail span:first-child {
  color: #9aa3c0;
}

.project__actions {
  display: flex;
  gap: 8px;
}

.lk-card__pills {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lk-card__pills li {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 13px;
}

.lk-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.lk__logout {
  border-color: rgba(255, 113, 113, 0.5);
  color: #ff9b9b;
}

@media (max-width: 768px) {
  .lk {
    margin-top: 32px;
    margin-bottom: 64px;
  }

  .lk__hero {
    flex-direction: column;
    padding: 28px;
    gap: 16px;
  }

  .lk__hero-actions {
    width: 100%;
    flex-direction: column;
  }

  .lk__hero-actions .btn {
    width: 100%;
  }

  .lk__grid {
    grid-template-columns: 1fr;
  }

  .lk-card__list li {
    flex-direction: column;
    gap: 4px;
  }

  .lk-card {
    padding: 20px;
  }

  .lk-card__actions {
    flex-direction: column;
  }

  .lk-card__actions .btn {
    width: 100%;
  }

  .project__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .project__detail {
    flex-direction: column;
    gap: 2px;
  }

  .projects-scroll-container {
    max-height: 350px;
  }
}

@media (max-width: 480px) {
  .lk__hero {
    border-radius: 20px;
    padding: 24px;
  }

  .lk-card {
    border-radius: 16px;
    padding: 16px;
  }

  .lk-card__pills {
    flex-direction: column;
  }

  .projects-scroll-container {
    max-height: 300px;
  }
}
</style>