import { validate } from './validate.js';

const form = document.getElementById('settings');
const save = document.getElementById('save');

save.addEventListener('click', async () => {
  const data = Object.fromEntries(new FormData(form));
  const errors = validate(data);
  for (const field of ['name', 'email', 'phone']) {
    document.getElementById(field).classList.toggle('invalid', Boolean(errors[field]));
  }
  if (Object.keys(errors).length) return;
  await fetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) });
});
