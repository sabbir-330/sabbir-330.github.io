PORTFOLIO (single page): Md Sabbir Ahmed
Run: open this folder in VS Code, right-click index.html, "Open with Live Server".
(Double-clicking index.html will NOT work because data.json is loaded with fetch.)

EVERYTHING IS EDITED IN data.json
- hero / socials / stats ...... Home section ("auto:" stats are counted from your data)
- news.items ................. Latest Updates (tree with hanging boards; the 7 newest show on desktop).
  news.tree: "line" = thin outline tree, remove it for the brown tree. news.board: "white" or "wood".
  Keep each update's text short: boards are a fixed size.
  Design version: <html data-variant="4"> in index.html (4 = final: Petrol colors + original structure).
- (same list) Add a new item anywhere; the page sorts newest first by "date" (YYYY-MM-DD)
- academics .................. CGPA, running trimester, total trimesters
- expertise.* ................ Focus, Skills, Experience, Education, Certificates, Achievements, Resume tabs
  skills: add "level": 70 to any skill to show a percentage bar (omitted = no bar)
- projects.items ............. cards. Fill "repo": "user/repo", "github", "demo" to show stats and buttons
- projects.items[].repo ...... "sabbir-330/repo-name" shows live stars/forks on that project card (GitHub API)
- contact.* .................. email, phone, whatsapp, telegram (empty = hidden)
  contact.formEndpoint: a Formspree/Web3Forms URL. Empty = the form opens the visitor's email app.
- chat.faq ................... chatbot answers. {skills} {projects} {certificates} {education} {contact} fill in automatically.

CV: assets/cv/CV_Md_Sabbir_Ahmed.pdf (replace with the final version, keep the same file name)
Certificates: assets/certs/*.webp
Hosting: push this folder with GitHub Desktop, then enable GitHub Pages (or drag the folder into Netlify).

SKILL PERCENTAGES: each skill in data.json has a "level" (0-100). The ring fills to that number.
These numbers are placeholders, change them to what you honestly feel. Remove "level" to show a full ring.

ICONS: skill logos come from Devicon and VS Code Icons (MIT), the sun/moon button from Fluent Emoji Flat (MIT). All files are in assets/icons, nothing loads from the internet.
Skill logo: set "img": "assets/icons/name.svg" on a skill in data.json (without it the Font Awesome "icon" is used).
Latest Updates: clean timeline (newest 4 + "View all updates" button). data.json news.style = "timeline"; set it back to "tree" for the old tree.
Logo: monogram S in assets/images/logo.svg and logo-v3.svg (variant 4 uses v3).
