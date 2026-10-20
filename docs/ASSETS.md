# Графіка v0.2

Проєктні растрові атласи створено вбудованою генерацією зображень, не скопійовано з Ragnarok Online або наданих референсів. Референси використано для розуміння деталізації, силуету, піксельного стилю та виразного руху. Оригінальні вкладення користувача не включені у публічний репозиторій.

Фінальні активні файли:
- `dist/assets/heroes-v2.png` — мечник, маг, лучник, стрілець; idle/walk/attack/cast.
- `dist/assets/heroes-extra-v2.png` — послушник, коваль, злодій, росинка; чотири пози кожного.
- `dist/assets/world-v2.png` — будинки, дерева, скриня, входи, святиня, вогнище, крамниця.
- `dist/assets/enemies-v2.png` — дракон, вовк, кажан, кістяний лучник; idle/walk/attack/hurt.
- `dist/assets/bosses-v2.png` — дубовий вартовий, окремий лицар-Хранитель, відьма, гриб; idle/walk/attack/cast/hurt пози.

Кожний атлас має 4×4 композицію, фактичні межі рядків перевірені та внесені у `content/atlas.js`, щоб не показувати фрагменти сусідніх персонажів. Phaser використовує конкретний кадр стану; хода чергує дві пози, атака/каст змінюють поставу й відображаються разом із механічним таймером. Це не повні 8-напрямкові покадрові набори.

Нормалізований набір промптів: «premium detailed crisp pixel-art RPG sprite atlas; actual transparent background; exactly four columns and four rows; each row one consistent character/creature, columns idle, walking, attacking, casting or hurt; full body and visible class weapon; rich hand-shaded details, strong silhouette, nostalgic Korean isometric RPG style; no labels, separators, floor or overlap between cells». Для environment-атласу — 16 окремих ізометричних об’єктів українського фентезійного прикордоння. Для босів окремо вимагалися різні силуети дерева з кореневими кінцівками й високого лицаря з алебардою.

Phaser 3.90 vendored для запуску без CDN; MIT license поруч у `dist/assets/PHASER-LICENSE.txt`. Бібліотека встановлена через npm; SHA/content можна відтворити з package-lock.json. Власні правила, проєкція, земля/колізії, UI та логіка написані у проєкті.
