Figma (Codia) export of the Flutter hiring PPC page, made functional.
- `index.html` / `index.css`: the exported markup and styles (CSS untouched). HTML edits: real `<form>`, inputs, selects, checkbox, FAQ answers, CTA/button attributes.
- `interactive.css` / `interactive.js`: FAQ accordion, form validation + submit, CTA scrolling, dropdown/checkbox behaviour.
- Set `FORM_ENDPOINT` at the top of `interactive.js` to receive leads (until then submissions are simulated locally).
- Images are still loaded from static.codia.ai; download them into the project before launch.
