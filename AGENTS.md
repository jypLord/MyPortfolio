# Repository Guidelines

## Project Structure & Module Organization
This repository is centered on the React frontend in `portfolio-front/`. Main application code lives in `portfolio-front/src`, with feature folders such as `pages/`, `components/`, `common/`, `projects/`, `services/`, `hooks/`, `utils/`, and `constants/`. Static assets are split between `portfolio-front/public/` and `portfolio-front/src/assets/`. Build output is generated in `portfolio-front/dist/` and should not be edited manually. Study notes and change reports belong in the top-level `report/` folder.

## Build, Test, and Development Commands
Run commands from `portfolio-front/`.

- `npm install`: install project dependencies.
- `npm run dev`: start the Vite dev server with the `/autoInvest` proxy enabled.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint for all `.js` and `.jsx` files.

## Coding Style & Naming Conventions
Use 2-space indentation in JSX, JS, and CSS. Follow the existing React pattern: component files use PascalCase (`HomePage.jsx`, `PriceChart.jsx`), hooks use `use...` naming (`useChartSeries.js`), and utility or service modules use descriptive camelCase names (`autoInvestApi.js`, `chartData.js`). Keep route-level pages under `src/pages/` and reusable UI under `src/components/` or `src/common/`. ESLint is configured in `portfolio-front/eslint.config.js`; run `npm run lint` before opening a PR.

## Testing Guidelines
There is currently no automated test suite configured in `package.json`. Until one is added, treat `npm run lint` and a local `npm run build` as the minimum validation step for every change. For UI updates, manually verify the main routes: `/`, `/projects`, and `/projects/autoInvest`.

## Commit & Pull Request Guidelines
Recent history mixes short Korean summaries with `fix:` and `feat:` prefixes, for example `fix: 기준가와 차트 간격 수정`. Prefer concise, imperative commit subjects and keep each commit focused on one change. Pull requests should include a short description, affected routes or components, manual verification notes, and screenshots for visual changes.

## Contributor Notes
`portfolio-front/Agents.md` includes a project-specific expectation: when you change frontend code, add a beginner-friendly explanation of the modified components in `report/`, typically in Korean unless told otherwise.
