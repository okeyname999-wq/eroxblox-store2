import { useEffect, useState } from 'react';
import avatar from "./assets/avatar.jpg";



const MIN_ROBUX = 500;
const MAX_ROBUX = 10000;
const STEP = 50;
const OFFICIAL_RATE_USD = 0.01;
const SALE_RATE_USD = OFFICIAL_RATE_USD * 0.8;
const USD_TO_RUB = 80;
const quickPicks = [1000, 2500, 5000, 10000];
const YOUTUBE_URL = 'https://www.youtube.com/@EroxBloxJust/featured';

const formatRub = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);

const clampRobux = (value) => {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return MIN_ROBUX;
  }

  return Math.min(MAX_ROBUX, Math.max(MIN_ROBUX, Math.round(numeric / STEP) * STEP));
};

const getRoute = () => {
  const pathname = window.location.pathname;

  if (pathname.startsWith('/admin')) {
    return { name: 'admin' };
  }

  if (pathname.startsWith('/promo/')) {
    return {
      name: 'promo',
      slug: decodeURIComponent(pathname.replace('/promo/', '')),
    };
  }

  return { name: 'store' };
};

const readApiPayload = async (response) => {
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    if (raw.startsWith('<!doctype') || raw.startsWith('<html')) {
      throw new Error('Сервер вернул HTML вместо ответа API. Запустите backend вместе с сайтом.');
    }

    throw new Error('Сервер вернул некорректный ответ.');
  }
};

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
  const [form, setForm] = useState({
    nickname: '',
    contact: '',
    note: '',
  });

  useLockBodyScroll(isCheckoutOpen);

  const salePrice = robux * SALE_RATE_USD * USD_TO_RUB;

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: form.nickname,
          contact: form.contact,
          note: form.note,
          robux,
          totalPrice: salePrice,
        }),
      });

      const data = await readApiPayload(response);

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось отправить заказ.');
      }

      setSubmitMessage('Заказ отправлен. Мы свяжемся с вами в Telegram.');
      setForm({
        nickname: '',
        contact: '',
        note: '',
      });
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Ошибка при отправке заказа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="page-shell">
        <div className="mesh mesh-a" />
        <div className="mesh mesh-b" />

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
              быстро и стильно.
            </h2>
            <p className="hero-text">
              Выбирайте количество, сразу смотрите итоговую цену и отправляйте заказ в один шаг.
            </p>

            <div className="official-banner">
              <div>
                <p className="micro-copy">Официальные ссылки</p>
                <strong>Youtube канал EroxBlox</strong>
              </div>
              <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="ghost-button nav-link">
                Открыть YouTube
              </a>
            </div>

            <div className="stat-row">
              <div className="stat-card">
                <span>Цена</span>
                <strong>{formatRub(salePrice)}</strong>
              </div>
              <div className="stat-card">
                <span>Заказ</span>
                <strong>1 шаг</strong>
              </div>
              <div className="stat-card">
                <span>Связь</span>
                <strong>Telegram</strong>
              </div>
            </div>
          </div>

          <section className="control-panel">
            <div className="panel-head">
              <div>
                <p className="micro-copy">Количество</p>
                <h3>{robux.toLocaleString('ru-RU')} Robux</h3>
              </div>

              <label className="number-field">
                <span>Свое значение</span>
                <input
                  type="number"
                  min={MIN_ROBUX}
                  max={MAX_ROBUX}
                  step={STEP}
                  value={robux}
                  onChange={(event) => setRobux(clampRobux(event.target.value))}
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
                <span>Цена</span>
                <strong>{formatRub(salePrice)}</strong>
              </article>
            </div>

            <button type="button" className="primary-button full-width" onClick={() => setIsCheckoutOpen(true)}>
              Перейти к оплате
            </button>
          </section>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <p className="micro-copy">01</p>
            <h3>Выбор количества</h3>
            <p>Слайдер и ручной ввод мгновенно обновляют цену без перезагрузки страницы.</p>
          </article>

          <article className="info-card featured">
            <p className="micro-copy">02</p>
            <h3>Черно-белый стиль</h3>
            <p>Премиальный монохромный интерфейс с мягким стеклом, крупной типографикой и чистым ритмом.</p>
          </article>

          <article className="info-card">
            <p className="micro-copy">03</p>
            <h3>Заказ в Telegram</h3>
            <p>Форма отправляет каждую заявку через серверную интеграцию с ботом без показа токена клиенту.</p>
          </article>
        </section>
      </main>

      {isCheckoutOpen ? (
        <ModalShell onClose={() => !isSubmitting && setIsCheckoutOpen(false)}>
          <div className="modal-head">
            <div>
              <p className="micro-copy">Оформление</p>
              <h3>Оплата заказа</h3>
            </div>
            <button
              type="button"
              className="close-button"
              onClick={() => !isSubmitting && setIsCheckoutOpen(false)}
            >
              Закрыть
            </button>
          </div>

          <div className="modal-grid">
            <form className="checkout-form" onSubmit={submitOrder}>
              <label>
                <span>Ваш ник</span>
                <input
                  name="nickname"
                  placeholder="Введите Roblox nickname"
                  value={form.nickname}
                  onChange={onFieldChange}
                  required
                />
              </label>

              <label>
                <span>Ваш пароль</span>
                <input
                  name="contact"
                  placeholder="@password"
                  value={form.contact}
                  onChange={onFieldChange}
                  required
                />
              </label>

              <label>
                <span>Комментарий</span>
                <textarea
                  name="note"
                  rows="4"
                  placeholder="Дополнительная информация по заказу"
                  value={form.note}
                  onChange={onFieldChange}
                />
              </label>

              <p className="safety-note"></p>

              <button type="submit" className="primary-button full-width" disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </button>

              {submitMessage ? <p className="submit-message">{submitMessage}</p> : null}
            </form>

            <aside className="order-summary">
              <p className="micro-copy">Детали</p>
              <div className="summary-row">
                <span>Количество</span>
                <strong>{robux.toLocaleString('ru-RU')} Robux</strong>
              </div>
              <div className="summary-row">
                <span>Цена</span>
                <strong>{formatRub(salePrice)}</strong>
              </div>
              <div className="summary-row">
                <span>Связь</span>
                <strong>Telegram</strong>
              </div>
              <div className="summary-row">
                <span>Статус</span>
                <strong>Ожидает подтверждения</strong>
              </div>
            </aside>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}

function AdminPage({ theme, setTheme }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState('');
  const [promos, setPromos] = useState([]);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });
  const [createForm, setCreateForm] = useState({
    robuxAmount: '100',
    maxActivations: '1',
  });

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
      try {
        await loadPromos();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Ошибка панели администратора.');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const onLogin = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`/api/admin/promos/${promoId}`, {
        method: 'DELETE',
      });
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
    await fetch('/api/admin/logout', {
      method: 'POST',
    });

    setIsAuthenticated(false);
    setPromos([]);
    setMessage('Вы вышли из админ-панели.');
  };

  return (
    <main className="page-shell">
      <div className="mesh mesh-a" />
      <div className="mesh mesh-b" />

        <TopBar
          theme={theme}
          setTheme={setTheme}
          brandLabel="Официальная панель управления"
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
          <strong>
            {promo.activations} / {promo.maxActivations}
          </strong>
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
  const [form, setForm] = useState({
    nickname: '',
    contact: '',
    note: '',
  });

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
        setIsClaimOpen(true);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await readApiPayload(response);

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось активировать промокод.');
      }

      setMessage(data.message);
      setPromo(data.promo);
      setIsClaimOpen(false);
      setForm({
        nickname: '',
        contact: '',
        note: '',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка активации промокода.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="page-shell">
        <div className="mesh mesh-a" />
        <div className="mesh mesh-b" />

        <TopBar
          theme={theme}
          setTheme={setTheme}
          brandLabel="Официальная промостраница"
          brandName="EroxBlox Store"
        />

        <section className="promo-shell">
          <div className="admin-card">
            {isLoading ? (
              <>
                <p className="micro-copy">Загрузка</p>
                <h2>Открываем промокод</h2>
                <p className="admin-text">Подгружаем параметры ссылки и количество Robux.</p>
              </>
            ) : promo ? (
              <>
                <p className="micro-copy">Промокод</p>
                <h2>Активируйте промокод на {promo.robuxAmount} Robux</h2>
                <p className="admin-text">
                  Нажмите кнопку ниже, введите ник и Telegram, затем заявка сразу придет владельцу сайта.
                </p>
                <div className="promo-meta">
                  <div className="promo-stat">
                    <span>Robux</span>
                    <strong>{promo.robuxAmount}</strong>
                  </div>
                  <div className="promo-stat">
                    <span>Доступно активаций</span>
                    <strong>{promo.maxActivations - promo.activations}</strong>
                  </div>
                </div>
                <button type="button" className="primary-button full-width" onClick={() => setIsClaimOpen(true)}>
                  Активировать промокод
                </button>
                <a href="/" className="ghost-button nav-link full-width back-home-link">
                  Вернуться на главную
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
      </main>

      {isClaimOpen && promo ? (
        <ModalShell onClose={() => !isSubmitting && setIsClaimOpen(false)}>
          <div className="modal-head">
            <div>
              <p className="micro-copy">Активация</p>
              <h3>Промокод на {promo.robuxAmount} Robux</h3>
            </div>
            <button
              type="button"
              className="close-button"
              onClick={() => !isSubmitting && setIsClaimOpen(false)}
            >
              Закрыть
            </button>
          </div>

          <div className="modal-grid">
            <form className="checkout-form" onSubmit={submitClaim}>
              <label>
                <span>Ваш ник</span>
                <input
                  name="nickname"
                  placeholder="Введите Roblox nickname"
                  value={form.nickname}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nickname: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                <span>Ваш Пароль</span>
                <input
                  name="contact"
                  placeholder="password"
                  value={form.contact}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contact: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                <span>Комментарий</span>
                <textarea
                  name="note"
                  rows="4"
                  placeholder="Дополнительная информация"
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                />
              </label>

              <button type="submit" className="primary-button full-width" disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Активировать'}
              </button>
            </form>

            <aside className="order-summary">
              <p className="micro-copy">Параметры</p>
              <div className="summary-row">
                <span>Промоссылка</span>
                <strong>{promo.slug}</strong>
              </div>
              <div className="summary-row">
                <span>Robux</span>
                <strong>{promo.robuxAmount}</strong>
              </div>
              <div className="summary-row">
                <span>Осталось</span>
                <strong>{promo.maxActivations - promo.activations}</strong>
              </div>
              <div className="summary-row">
                <span>Статус</span>
                <strong>Готов к активации</strong>
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
      <div
        className="brand"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <img
          src={avatar}
          alt="Avatar"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid white",
            boxShadow: "0 0 15px rgba(255,255,255,.25)",
          }}
        />

        <div>
          <p className="micro-copy">{brandLabel}</p>
          <h1>{brandName}</h1>
        </div>
      </div>

      <div className="nav-actions">
        <a
          href={YOUTUBE_URL}
          target="_blank"
          rel="noreferrer"
          className="ghost-button nav-link"
        >
          YouTube
        </a>

        <button
          type="button"
          className="ghost-button"
          onClick={() =>
            setTheme((current) => (current === "dark" ? "light" : "dark"))
          }
        >
          {theme === "dark" ? "Черная тема" : "Белая тема"}
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

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocked]);
}

export default App;
