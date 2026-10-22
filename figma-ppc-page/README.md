Figma (Codia) export of the Flutter hiring PPC page, made functional.
- `index.html` / `index.css`: exported markup and styles (CSS untouched). HTML edits: real `<form>`s, inputs, selects, checkbox, FAQ answers, CTA attributes, Calendly popup markup.
- `interactive.css` / `interactive.js`: FAQ accordion, enquiry form, Calendly popup.
- Enquiry form: validated client-side, posts to the Developer Bazaar Google Apps Script endpoint (`FORM_ENDPOINT` in `interactive.js`) exactly like the dating page. Country code is auto-detected.
- Every CTA button (except the form submit) opens the Calendly popup (arpit-vaishnav/app-strategy-call).
- Images are still loaded from static.codia.ai; download them into the project before launch.
