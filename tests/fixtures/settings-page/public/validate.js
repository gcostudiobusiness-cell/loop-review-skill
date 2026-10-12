// Settings form validation. Returns { field: message } for each invalid field.
export function validate({ name = '', email = '', phone = '' }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter a display name.';
  else if (name.length > 40) errors.name = 'Display name must be 40 characters or fewer.';
  if (!/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) errors.email = 'Enter a valid email address.';
  if (phone && !/^\d+$/.test(phone)) errors.phone = 'Phone number can only contain digits.';
  return errors;
}
