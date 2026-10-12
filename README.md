# Gashapon Monster · V0.3 GBA jouable

Village original de 20 × 15 cases, déplacements sur grille 16 × 16, affichage 240 × 160. Vite et Phaser 4.2.1. Héros et PNJ PNG, atlas de village modulaire, caméra bornée, profondeur par les pieds, dialogues français et commandes Android. Aucun combat ni collection.

## Lancer sur Android

Dans le terminal Acode, depuis `/public/gashapon-monster` :

```sh
npm run dev
```

Ouvrir **http://127.0.0.1:5173/** dans Chrome sur le même téléphone. Arrêter avec Ctrl+C. Vite écoute sur la boucle locale pour éviter les restrictions Android sur les interfaces réseau.

- Croix tactile, flèches clavier ou manette standard : marcher.
- A / Entrée / Z : parler au PNJ devant le héros, puis continuer.
- B / Échap / X : fermer le dialogue.
- GRILLE DEBUG / D : afficher les cases bloquées.
- Mila est en (10, 7), le départ en (8, 9).

Le jeu utilise directement les PNG préparés. Les pieds restent sur la même ligne de grille, la taille du dessin ne sert jamais aux collisions. La porte est visible mais fermée : aucun intérieur n’est développé.

## Graphismes

Les sources `public/assets/hero-gba.png`, `npc-gba.png` et `village-gba.png` sont conservées. Le héros et le PNJ utilisent les atlas validés dans `public/assets/gba-prepared`. Les cadres d’animation font 32 × 32 ; les dimensions visibles restent autour de 24 × 32, comme dans l’aperçu. Aucun redimensionnement du personnage pendant le jeu.

`public/assets/gba-v03` ajoute un atlas de 54 tuiles avec une maison dotée d’une vraie porte extraite de la planche source, une fondation et des plantations latérales sur l’emprise bloquée existante. Les chemins suivent les voisins de la carte logique. Les arbres et le toit peuvent recouvrir le joueur lorsqu’il passe derrière. Les pieds déterminent l’ordre d’affichage et restent indépendants des collisions.

L’affichage Android remplit maintenant environ 95–98 % de la largeur en portrait, avec un agrandissement CSS fractionnaire net et un ratio 3:2. En paysage, le jeu est entouré des commandes latérales ; un bouton permet d’entrer et de sortir du plein écran sans verrouillage d’orientation. La résolution interne reste 240 × 160. Le dialogue HTML reste lisible au-dessus de l’écran. Dimensions calculées et validation : `docs/ANDROID-DISPLAY.md`. La version précédente est conservée dans `V0.3-PRE-ERGONOMIE`.

## Organisation

- `src/main.js` : chargement PNG, scène jouable, caméra et câblage des interactions.
- `src/world/map.js` : données logiques et collisions inchangées, caméra adaptée au viewport.
- `src/world/gbaWorld.js` : tuiles, raccords et couches visuelles.
- `src/world/characterGraphics.js` : frames PNG, origine et profondeur.
- `src/entities/Player.js` : déplacement existant, présentation PNG.
- `src/input/Controls.js` : contrôles existants inchangés.
- `src/ui/interface.js` / `src/style.css` : interface V0.3 et dialogues existants.
- `src/ui/mobileLayout.js` : affichage responsive et plein écran Android, sans redimensionnement du monde.
- `gba-preview.html` : aperçu graphique séparé toujours accessible.

Les anciens modules de dessins JavaScript sont conservés pour référence mais ne sont plus importés par le jeu principal.

## Vérifications

```sh
npm test
npm run build
```

Les tests couvrent la conservation de la carte et des collisions, les quatre directions, les frames PNG, les pieds, les bornes de caméra, les chemins, la porte, les contrôles simulés, les dialogues et le debug dans la scène réelle avec des API Phaser/DOM simulées. Ils ne remplacent pas un essai WebGL/tactile dans Chrome Android. Les images dans `tools/asset-analysis/v03-world.png` et `v03-start.png` sont des diagnostics statiques, pas des captures de navigateur.

Sur Motorola : vérifier la fluidité dans les quatre directions ; maintenir une direction contre un arbre, une barrière, la maison et chaque bord ; passer derrière les feuillages et le toit ; lire les trois messages de Mila ; fermer avec B ; tester le multitouch et le debug. La caméra ne doit pas dépasser le monde. L’intérieur de la maison reste inaccessible.

## Ressources et versions conservées

`V0.1-STABLE` et `V0.2-PRE-GBA` restent inchangées. L’aperçu validé et ses PNG préparés ne sont pas remplacés par la V0.3.

L’importateur indépendant fonctionne toujours avec `node tools/import-image.mjs` sur `http://127.0.0.1:5174` (arrêt Ctrl+C). Remplacer les PNG sources nécessite une nouvelle analyse avant régénération : les découpes ne sont pas universelles.

Préparation reproductible :

```sh
node tools/prepare-gba-assets.mjs
node tools/prepare-gba-v03.mjs
node tools/render-v03.mjs
```

Les deux premières commandes écrivent seulement les ressources dérivées. Le build conserve l’avertissement de taille du bundle Phaser. Aucune nouvelle dépendance. Détails de préparation initiale : `docs/GBA-ASSETS.md`.

## Version publique V0.4 — préparation GitHub Pages

La version validée avant adaptation est conservée dans V0.4-STABLE (local uniquement).
Le développement reste sur http://127.0.0.1:5173/. Après npm run build, tester avec
npm run preview -- --port 4173 --strictPort puis ouvrir http://127.0.0.1:4173/gashapon-monster/.
Le workflow publie uniquement dist lors d'un push volontaire sur la branche publication.
Aucune publication n'a été effectuée pendant la préparation.

Voir [le guide Android et les étapes de publication](docs/GITHUB-PAGES.md).
