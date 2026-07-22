const storageKey = 'tournament-admin-authenticated';
const eventIdPattern = /^[a-z0-9][a-z0-9-]*$/;
const nodes = {
  login: document.querySelector('#adminLogin'), app: document.querySelector('#adminApp'), loginForm: document.querySelector('#loginForm'), password: document.querySelector('#adminPassword'), loginMessage: document.querySelector('#loginMessage'), eventList: document.querySelector('#eventList'), form: document.querySelector('#eventForm'), json: document.querySelector('#eventJson'), title: document.querySelector('#editorTitle'), editorMessage: document.querySelector('#editorMessage'), delete: document.querySelector('#deleteEvent'), imageFile: document.querySelector('#imageFile'), import: document.querySelector('#importEvent')
};
let events = [];
let selectedId = '';

const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const showMessage = (node, message, error = false) => { node.textContent = message; node.classList.toggle('is-error', error); };
const eventFile = (id) => `${id}.json`;
const eventTemplate = (id = 'neues-turnier-2026-01-01') => ({ id, organizer: { name: '', logo: { url: '', alt: '' } }, event: { name: 'Neues Turnier', date: '2026-01-01', startTime: '10:00', location: '' }, quickInfo: [], trainerMeeting: { time: '', location: '' }, awardCeremony: { isPlanned: false }, catering: { offerings: [] }, directions: { address: '' }, fieldLayout: { summary: '', fields: [] }, matches: [] });

async function loadEvents() {
  const manifest = await fetch('./data/events/index.json', { cache: 'no-store' }).then((response) => { if (!response.ok) throw new Error('Event-Verzeichnis konnte nicht geladen werden.'); return response.json(); });
  events = await Promise.all((manifest.events ?? []).map(async ({ id, file }) => ({ id, ...await fetch(`./data/events/${file}`, { cache: 'no-store' }).then((response) => { if (!response.ok) throw new Error(`Event ${id} konnte nicht geladen werden.`); return response.json(); }) })));
  selectedId = events[0]?.id ?? '';
  render();
}

function selectedEvent() { return events.find((event) => event.id === selectedId); }
function render() {
  nodes.eventList.innerHTML = events.map((event) => `<button class="event-list-item${event.id === selectedId ? ' is-selected' : ''}" data-id="${escapeHtml(event.id)}" type="button"><strong>${escapeHtml(event.event?.name || 'Unbenanntes Event')}</strong><small>${escapeHtml(event.event?.date || event.id)}</small></button>`).join('');
  const event = selectedEvent();
  nodes.title.textContent = event ? `Event: ${event.event?.name || event.id}` : 'Neues Event';
  nodes.json.value = event ? JSON.stringify(event, null, 2) : '';
  nodes.delete.disabled = !event;
}

function validate(event) {
  if (!eventIdPattern.test(String(event.id ?? ''))) throw new Error('Die Event-ID darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.');
  if (!event.event?.name || !event.event?.date || !event.event?.startTime || !event.event?.location) throw new Error('Name, Datum, Startzeit und Ort sind Pflichtfelder.');
  if (!Array.isArray(event.matches)) throw new Error('matches muss ein Array sein.');
}
function saveEditor() {
  let event;
  try { event = JSON.parse(nodes.json.value); validate(event); } catch (error) { showMessage(nodes.editorMessage, error.message || 'Ungültiges JSON.', true); return false; }
  const duplicate = events.some((item) => item.id === event.id && item.id !== selectedId);
  if (duplicate) { showMessage(nodes.editorMessage, 'Diese Event-ID ist bereits vergeben.', true); return false; }
  const index = events.findIndex((item) => item.id === selectedId);
  if (index >= 0) events[index] = event; else events.push(event);
  selectedId = event.id; render(); showMessage(nodes.editorMessage, 'Änderungen übernommen.'); return true;
}
function downloadBlob(blob, filename) { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 0); }
function downloadData() {
  if (!saveEditor()) return;
  const files = { 'index.json': JSON.stringify({ events: events.map(({ id }) => ({ id, file: eventFile(id) })) }, null, 2) + '\n' };
  events.forEach((event) => { const { id, ...data } = event; files[eventFile(id)] = JSON.stringify(data, null, 2) + '\n'; });
  downloadBlob(new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' }), 'event-daten-export.json');
  showMessage(nodes.editorMessage, 'Export heruntergeladen. Die Datei enthält alle Dateien aus data/events.');
}
async function sha256(value) { const bytes = new TextEncoder().encode(value); const hash = await crypto.subtle.digest('SHA-256', bytes); return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }
async function authenticate(password) { const config = await fetch('./data/admin.json', { cache: 'no-store' }).then((response) => response.json()); return (await sha256(password)) === config.passwordHash; }
function unlock() { nodes.login.hidden = true; nodes.app.hidden = false; sessionStorage.setItem(storageKey, '1'); loadEvents().catch((error) => showMessage(nodes.loginMessage, error.message, true)); }

nodes.loginForm.addEventListener('submit', async (event) => { event.preventDefault(); try { if (await authenticate(nodes.password.value)) unlock(); else showMessage(nodes.loginMessage, 'Passwort ist nicht korrekt.', true); } catch { showMessage(nodes.loginMessage, 'Anmeldung konnte nicht geprüft werden.', true); } });
nodes.eventList.addEventListener('click', (event) => { const button = event.target.closest('[data-id]'); if (!button) return; selectedId = button.dataset.id; render(); });
nodes.form.addEventListener('submit', (event) => { event.preventDefault(); saveEditor(); });
document.querySelector('#newEvent').addEventListener('click', () => { const id = `turnier-${new Date().toISOString().slice(0, 10)}`; selectedId = ''; nodes.json.value = JSON.stringify(eventTemplate(id), null, 2); nodes.title.textContent = 'Neues Event'; nodes.delete.disabled = true; showMessage(nodes.editorMessage, 'Bitte Daten ausfüllen und übernehmen.'); });
nodes.delete.addEventListener('click', () => { const event = selectedEvent(); if (!event || !confirm(`Event „${event.event?.name || event.id}“ wirklich löschen?`)) return; events = events.filter((item) => item.id !== selectedId); selectedId = events[0]?.id ?? ''; render(); showMessage(nodes.editorMessage, 'Event gelöscht.'); });
document.querySelector('#downloadData').addEventListener('click', downloadData);
document.querySelector('#logout').addEventListener('click', () => { sessionStorage.removeItem(storageKey); location.reload(); });
document.querySelector('#uploadImage').addEventListener('click', () => nodes.imageFile.click());
nodes.imageFile.addEventListener('change', () => { const file = nodes.imageFile.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const event = JSON.parse(nodes.json.value); event.organizer ??= {}; event.organizer.logo = { url: reader.result, alt: file.name }; nodes.json.value = JSON.stringify(event, null, 2); showMessage(nodes.editorMessage, 'Veranstalterlogo eingebettet. Bitte Alt-Text prüfen und Änderungen übernehmen.'); } catch { showMessage(nodes.editorMessage, 'Zuerst gültige Event-Daten im Editor bereitstellen.', true); } }; reader.readAsDataURL(file); });
nodes.import.addEventListener('change', async () => { const file = nodes.import.files?.[0]; if (!file) return; try { const incoming = JSON.parse(await file.text()); if (!incoming.id) throw new Error('Die importierte Datei muss ein einzelnes Event mit id enthalten.'); validate(incoming); const index = events.findIndex((event) => event.id === incoming.id); if (index >= 0) events[index] = incoming; else events.push(incoming); selectedId = incoming.id; render(); showMessage(nodes.editorMessage, 'Event importiert.'); } catch (error) { showMessage(nodes.editorMessage, error.message || 'Import fehlgeschlagen.', true); } });
if (sessionStorage.getItem(storageKey) === '1') unlock();
