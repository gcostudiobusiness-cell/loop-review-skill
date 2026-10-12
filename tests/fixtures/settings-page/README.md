# settings-page

The account settings page for our community forum. Members edit their display name, email, phone and language.

- Audience: forum members, many of them on phones.
- Style: plain and quiet. We use one accent colour (`#2d6cdf`) and the system font.
- Serve `public/` with any static server, for example `python3 -m http.server -d public`. The page saves to `PUT /api/settings`, which the forum backend provides.

Run the tests with `npm test`.
