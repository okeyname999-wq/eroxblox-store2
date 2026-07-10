import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const dataDir = path.join(__dirname, 'data');
const promoStorePath = path.join(dataDir, 'promos.json');
const port = Number(process.env.PORT || 8787);
const adminSessions = new Map();

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'NikLaAdmin';

app.use(express.json());

const ensurePromoStore = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(promoStorePath);
  } catch {
    await fs.writeFile(promoStorePath, '[]', 'utf8');
  }
};

const readPromos = async () => {
  await ensurePromoStore();
  const raw = await fs.readFile(promoStorePath, 'utf8');
  return JSON.parse(raw);
};

const writePromos = async (promos) => {
  await ensurePromoStore();
  await fs.writeFile(promoStorePath, JSON.stringify(promos, null, 2), 'utf8');
};

const parseCookies = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((accumulator, item) => {
    const [name, ...rest] = item.trim().split('=');

    if (!name) {
      return accumulator;
    }

    accumulator[name] = decodeURIComponent(rest.join('='));
    return accumulator;
  }, {});

const getAdminSession = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  return cookies.admin_session;
};

const requireAdmin = (req, res, next) => {
  const sessionToken = getAdminSession(req);

  if (!sessionToken || !adminSessions.has(sessionToken)) {
    return res.status(401).json({
      ok: false,
      message: 'Требуется вход в админ-панель.',
    });
  }

  return next();
};

const sendTelegramMessage = async (lines) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('Переменные Telegram не настроены.');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join('\n'),
    }),
  });

  if (!response.ok) {
    throw new Error(`Ошибка Telegram API: статус ${response.status}.`);
  }
};

const sendOrderToTelegram = async ({ nickname, contact, robux, totalPrice, note }) => {
  await sendTelegramMessage([
    'Новый заказ',
    '',
    `Ник: ${nickname}`,
    `Telegram: ${contact}`,
    `Robux: ${robux}`,
    `Цена: ${Math.round(Number(totalPrice)).toLocaleString('ru-RU')} RUB`,
    `Комментарий: ${note || '-'}`,
    `Создан: ${new Date().toISOString()}`,
  ]);
};

const sendPromoClaimToTelegram = async ({ promo, nickname, contact, note, activationNumber }) => {
  await sendTelegramMessage([
    'Активация промокода',
    '',
    `Ссылка: ${promo.slug}`,
    `Robux: ${promo.robuxAmount}`,
    `Ник: ${nickname}`,
    `Telegram: ${contact}`,
    `Комментарий: ${note || '-'}`,
    `Активация: ${activationNumber} / ${promo.maxActivations}`,
    `Создано: ${new Date().toISOString()}`,
  ]);
};

app.post('/api/order', async (req, res) => {
  const { nickname, contact, robux, totalPrice, note } = req.body ?? {};

  if (!nickname || !contact || !robux || !totalPrice) {
    return res.status(400).json({
      ok: false,
      message: 'Не заполнены обязательные поля заказа.',
    });
  }

  try {
    await sendOrderToTelegram({
      nickname: String(nickname).trim(),
      contact: String(contact).trim(),
      robux: Number(robux),
      totalPrice: Number(totalPrice),
      note: note ? String(note).trim() : '',
    });

    return res.json({
      ok: true,
      message: 'Заказ успешно отправлен.',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка сервера.',
    });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (username !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      ok: false,
      message: 'Неверный логин или пароль.',
    });
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  adminSessions.set(sessionToken, {
    createdAt: Date.now(),
  });

  res.setHeader(
    'Set-Cookie',
    `admin_session=${encodeURIComponent(sessionToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`,
  );

  return res.json({
    ok: true,
    message: 'Вход выполнен.',
  });
});

app.post('/api/admin/logout', (req, res) => {
  const sessionToken = getAdminSession(req);

  if (sessionToken) {
    adminSessions.delete(sessionToken);
  }

  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');

  return res.json({
    ok: true,
  });
});

app.get('/api/admin/promos', requireAdmin, async (req, res) => {
  try {
    const promos = await readPromos();

    return res.json({
      ok: true,
      promos: promos.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Не удалось прочитать список промокодов.',
    });
  }
});

app.post('/api/admin/promos', requireAdmin, async (req, res) => {
  const robuxAmount = Number(req.body?.robuxAmount);
  const maxActivations = Number(req.body?.maxActivations || 1);

  if (!Number.isFinite(robuxAmount) || robuxAmount <= 0 || !Number.isFinite(maxActivations) || maxActivations <= 0) {
    return res.status(400).json({
      ok: false,
      message: 'Некорректные параметры промокода.',
    });
  }

  try {
    const promos = await readPromos();
    const promo = {
      id: crypto.randomUUID(),
      slug: crypto.randomBytes(6).toString('hex'),
      robuxAmount: Math.round(robuxAmount),
      maxActivations: Math.round(maxActivations),
      activations: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    promos.push(promo);
    await writePromos(promos);

    return res.json({
      ok: true,
      promo,
      promos: promos.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Не удалось создать промокод.',
    });
  }
});

app.delete('/api/admin/promos/:id', requireAdmin, async (req, res) => {
  try {
    const promos = await readPromos();
    const filtered = promos.filter((promo) => promo.id !== req.params.id);

    await writePromos(filtered);

    return res.json({
      ok: true,
      promos: filtered.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Не удалось удалить промокод.',
    });
  }
});

app.get('/api/promo/:slug', async (req, res) => {
  try {
    const promos = await readPromos();
    const promo = promos.find((item) => item.slug === req.params.slug);

    if (!promo || !promo.isActive || promo.activations >= promo.maxActivations) {
      return res.status(404).json({
        ok: false,
        message: 'Промокод больше недоступен.',
      });
    }

    return res.json({
      ok: true,
      promo,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Не удалось загрузить промокод.',
    });
  }
});

app.post('/api/promo/:slug/claim', async (req, res) => {
  const { nickname, contact, note } = req.body ?? {};

  if (!nickname || !contact) {
    return res.status(400).json({
      ok: false,
      message: 'Нужно указать ник и Telegram.',
    });
  }

  try {
    const promos = await readPromos();
    const promo = promos.find((item) => item.slug === req.params.slug);

    if (!promo || !promo.isActive || promo.activations >= promo.maxActivations) {
      return res.status(404).json({
        ok: false,
        message: 'Промокод уже использован или отключен.',
      });
    }

    promo.activations += 1;

    if (promo.activations >= promo.maxActivations) {
      promo.isActive = false;
    }

    await writePromos(promos);

    await sendPromoClaimToTelegram({
      promo,
      nickname: String(nickname).trim(),
      contact: String(contact).trim(),
      note: note ? String(note).trim() : '',
      activationNumber: promo.activations,
    });

    return res.json({
      ok: true,
      message: 'Промокод активирован. Заявка отправлена владельцу сайта.',
      promo,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Ошибка активации промокода.',
    });
  }
});

app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  return res.sendFile(path.join(distPath, 'index.html'));
});

await ensurePromoStore();

app.listen(port, () => {
  console.log(`EroxBlox Store server running on http://localhost:${port}`);
});
