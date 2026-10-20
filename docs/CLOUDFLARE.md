# Розгортання клієнта на Workers · 0.3.1

У корені є `wrangler.jsonc`, який вказує `assets.directory = ./dist` та `main = worker/index.js`.

У Cloudflare Workers Builds для репозиторію:

- Root directory: `/` (корінь репозиторію).
- Build command: `npm run build`.
- Deploy command: `npx wrangler deploy`.
- Production branch: `main`.

Після оновлення `main` дочекайтеся нового deployment. Не використовуйте `npm start` як build/deploy: він запускає Node HTTP/WebSocket/SQLite сервер, який не є Worker. Worker у цьому виправленні надає локальну гру та чесний `/api/health` без обіцянки онлайн-кімнат. Платні служби не підключено.

Перевірки: корінь має віддавати HTML гри, `/bootstrap.js` — JavaScript, `/content/classes.js?v=0.3.1` — JavaScript, `/assets/heroes-v2.png` — PNG; `/api/health` — JSON з `mode: static-local`. Екран завантаження має змінитися вибором героя. Збереження v2/v3 зберігаються.

Офіційна конфігурація static assets: https://developers.cloudflare.com/workers/static-assets/configuration/

---

# Сервер і безкоштовні обмеження — перевірено 20.10.2026

## Фактичне розгортання

Поточне стале посилання — статичний Phaser-клієнт із локальним режимом. Node+WebSocket+SQLite сервер знаходиться у репозиторії; його функціональність перевірено локально на реальних клієнтах. Платні сервіси не підключені. Цей Node-процес з `node:sqlite` не запускається у Cloudflare Workers без адаптації.

## Перевірені офіційні квоти

| Служба | Free |
|---|---|
| Workers | 100 000 requests/day, 10 ms CPU/request, 128 MB memory |
| Durable Objects | SQLite-backed підтримані у Free; 100 000 requests/day; 13 000 GB-s duration/day |
| D1 | 5 млн rows read/day, 100 000 rows written/day, 5 GB storage |

Джерела:
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/

D1 при перевищенні безкоштовних добових квот перестає виконувати запити до скидання ліміту. Оплата не є автоматично погодженим кроком.

## Чому не записувати кожен tick у D1

10 записів/с ×8 героїв ×3600 с = 288 000 записів за годину ще без індексів, луту та команд. Це перевищує безкоштовні 100 000 rows written/day. Навіть один room snapshot кожен tick дає 864 000 записів/день на кімнату. Запис стану треба робити checkpoint-ами й атомарно для критичних операцій, не кожен кадр.

Один постійно активний DO при розрахункових 128 MB має близько `86400×0.128≈11059 GB-s/day`, тобто майже весь Free-бюджет 13 000 GB-s/day. Це орієнтовний підрахунок тривалості, не вимірювання цього застосунку в Cloudflare. Декілька цілодобових активних кімнат на безкоштовність уже не вкладаються. Hibernation корисна, коли кімната не симулює активний бій; вона не робить безкоштовним постійний tick. Request billing WebSocket має власні правила в документації DO; не слід прирівнювати кожен мережевий пакет до окремого звичайного Worker request.

## Запропонований наступний production-етап

1. Зберегти незалежне simulation ядро, відділити HTTP/ws adapter від збереження (зараз вони в server/index.js).
2. Один SQLite Durable Object на кімнату: авторитетна симуляція, ідемпотентність і snapshot в одному actor.
3. Workers gateway для сесій та маршрутизації; D1 тільки для профілів/метаданих, без cross-store транзакцій критичного луту.
4. Client prediction/interpolation + delta snapshots + interest filtering.
5. Протестувати фактичні DO CPU/duration/SQL квоти на двох і восьми клієнтах. До цього не заявляти безкоштовну підтримку масового MMO.

Ні платного Workers, ні зовнішнього managed PostgreSQL у поточній версії немає. Якщо виміри покажуть нестачу Free-квот, наступне рішення щодо платного плану має бути погоджене окремо з конкретними вимірами та бюджетом.
