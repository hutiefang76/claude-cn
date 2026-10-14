export const STORAGE_KEY = 'claude-cn:v1';
export const dateKey = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
export const initialState = (now = new Date()) => ({
  version: 1, day: dateKey(now), balance: 23456, growth: 680, ads: 0, boxes: 0,
  signedDate: '', streak: 0, welcome: false, invited: false, subscription: false,
  level: 'A6', model: 'A6 Sonnet', speed: '1.0x', messages: [], plugins: [],
});
export function loadState(storage, now = new Date()) {
  const fresh = initialState(now);
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || raw.version !== 1) return fresh;
    const value = { ...fresh };
    for (const k of ['balance', 'growth', 'ads', 'boxes', 'streak']) {
      if (Number.isFinite(raw[k]) && raw[k] >= 0) value[k] = Math.min(Math.floor(raw[k]), 1e9);
    }
    for (const k of ['welcome', 'invited', 'subscription']) value[k] = raw[k] === true;
    value.signedDate = typeof raw.signedDate === 'string' ? raw.signedDate : '';
    value.level = ['A6', 'A7', 'A9', 'A10'].includes(raw.level) ? raw.level : 'A6';
    value.model = ['A6 Sonnet', 'A7 Sonnet', 'A9 Opus mini', 'A10 Opus 4.5'].includes(raw.model) ? raw.model : 'A6 Sonnet';
    value.speed = ['1.0x', '1.5x'].includes(raw.speed) ? raw.speed : '1.0x';
    value.messages = Array.isArray(raw.messages) ? raw.messages.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.text === 'string').slice(-50).map(m => ({ role: m.role, text: m.text.slice(0, 6000) })) : [];
    value.plugins = Array.isArray(raw.plugins) ? raw.plugins.filter(p => ['search', 'code', 'files'].includes(p)) : [];
    for (const key of ['tasks', 'ledger', 'orders', 'tickets']) if (Array.isArray(raw[key])) value[key] = raw[key];
    for (const key of ['account', 'entitlements']) if (raw[key] && typeof raw[key] === 'object') value[key] = raw[key];
    if (typeof raw.activeTaskId === 'string') value.activeTaskId = raw.activeTaskId;
    if (raw.day !== fresh.day) { value.ads = 0; value.boxes = 0; }
    return value;
  } catch { return fresh; }
}
export function rollDay(state, now = new Date()) {
  if (state.day !== dateKey(now)) { state.day = dateKey(now); state.ads = 0; state.boxes = 0; }
}
export function signIn(state, now = new Date()) {
  rollDay(state, now);
  if (state.signedDate === state.day) return 0;
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  state.streak = state.signedDate === dateKey(yesterday) ? state.streak + 1 : 1;
  const reward = [20, 40, 60, 80, 100, 120, 120][(state.streak - 1) % 7];
  state.signedDate = state.day; state.balance += reward; state.growth += 20;
  return reward;
}
export function watchAd(state, now = new Date()) {
  rollDay(state, now);
  if (state.ads >= 10) return 0;
  state.ads++; state.balance += 20; return 20;
}
export function openBox(state, random = Math.random, now = new Date()) {
  rollDay(state, now);
  if (state.boxes >= 3 + Math.floor(state.ads / 3)) return 0;
  const r = random();
  const reward = r < .50 ? 20 : r < .80 ? 60 : r < .95 ? 120 : r < .995 ? 500 : 50000;
  state.boxes++; state.balance += reward; return reward;
}
