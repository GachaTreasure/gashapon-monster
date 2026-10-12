> Historique de la préparation : les ressources sont maintenant intégrées au jeu jouable V0.3 à `/`. L’aperçu isolé et ses assets restent conservés. Voir le README pour l’état actuel.

# Aperçu des ressources GBA importées

Le prototype principal reste inchangé à `/`. La nouvelle scène visuelle est indépendante :

```sh
npm run dev
```

Ouvrir **http://127.0.0.1:5173/gba-preview.html** sur le même téléphone. Face/Gauche/Droite/Dos changent l’orientation des deux personnages. Le bouton d’animation active ou met en pause la marche sur place. Il ne s’agit pas encore d’une migration du gameplay.

## Versions conservées

- `V0.1-STABLE` reste intacte.
- `V0.2-PRE-GBA` conserve le projet avant l’ajout de cette scène, sans `node_modules` ni `dist`, avec les trois PNG originaux.
- Les fichiers originaux dans `public/assets` ne sont jamais écrasés par la préparation.

## Analyse et extraction

Les trois fichiers ont une vraie couche alpha, mais contiennent beaucoup de pixels partiellement transparents. Ils sont en RGBA8, sans entrelacement. Le héros et le PNJ mesurent 1448 × 1086 ; le village 1254 × 1254.

Les personnages n’ont pas des cellules régulières. Douze composantes principales sont détectées d’après leur transparence, puis classées en quatre rangées et trois poses. Les limites réelles de chaque pose sont enregistrées dans `public/assets/gba-prepared/manifest.json`. L’ordre contrôlé visuellement est face, gauche, droite, dos ; dans chaque rangée : pas, repos, autre pas.

Chaque personnage utilise une réduction uniforme propre à sa planche, avec une hauteur maximale de contenu de 30 pixels. Les rectangles d’animation communs sont 32 × 32 ; le héros occupe environ 21–23 × 29–30 pixels et le PNJ environ 25–26 × 27–30 pixels. Le chapeau du PNJ dépasse donc légèrement une largeur cible de 24 pixels. Aucun axe n’est étiré séparément. Les douze poses utilisent la même échelle pour éviter un changement artificiel de taille pendant la marche. Les pieds partagent la ligne 31 et les sprites ont l’origine `(0.5, 31/32)`.

Les alpha inférieurs ou égaux à 127 sont supprimés et les autres deviennent opaques. Cette correction explicite retire les faibles halos des PNG générés. La réduction utilise le voisin le plus proche : aucun lissage, mais certains détails inférieurs à un pixel sont perdus. La planche générée n’étant pas un dessin natif à 24 × 32, une retouche manuelle à la taille finale pourra améliorer encore les visages et les extrémités des animations.

## Village modulaire

L’atlas `village-tiles.png` contient **38 cellules de 16 × 16**. Maison et arbres sont constitués de plusieurs cellules avec transparence. Les limites des éléments du décor ont été sélectionnées manuellement, sans découpage uniforme de la grande planche.

- Herbe et terre : échantillons intérieurs, bords opposés harmonisés par copie de pixels.
- Chemins : seize formes composées des mêmes échantillons, avec des masques de raccord explicites. Les raccords dessinés sur la planche générée ne sont pas directement réutilisés, car leurs dimensions et leurs jonctions sont irrégulières.
- Arbre : élément isolé réduit uniformément vers 32 × 40, dans un bloc de 32 × 48.
- Maison : pignon central isolé par un polygone documenté, réduit uniformément vers 48 × 61 dans un bloc de 48 × 64. Les toits voisins ne sont pas inclus. C’est une façade à fenêtre, sans porte accessible ; aucun dialogue ni comportement d’entrée n’est ajouté.

L’atlas est exploitable comme ensemble de tuiles pour cette scène de contrôle. Il ne constitue pas encore un kit de construction complet avec toutes les variantes de murs, toits, angles et transitions. Pour une prochaine intégration complète, une correction utile serait une planche de décor native à 16 pixels : angles et jonctions de chemins cohérents, tuiles de toit séparées, porte de maison et façades modulaires, alpha strictement binaire. Aucune approximation de ces pièces manquantes n’est intégrée silencieusement au jeu.

## Régénération et vérification

```sh
node tools/prepare-gba-assets.mjs
node tools/render-gba-preview.mjs
npm test
npm run build
```

La préparation se limite aux fichiers dérivés de `public/assets/gba-prepared`. Elle refuse un nombre inattendu de composantes principales dans les planches de personnages. Les coordonnées du décor sont spécifiques aux PNG actuels : si ces PNG sont remplacés, il faut les inspecter et adapter les découpes.

`tools/asset-analysis/gba-preview.png` est un diagnostic statique issu du même atlas et du même placement que la scène. Il ne constitue pas une capture du navigateur. Treize tests vérifient notamment les sources originales, les alpha, les poses et leurs proportions, la reconstruction du décor depuis les cellules, et la conservation des fichiers existants du prototype.

Le build exporte les deux pages séparément et partage Phaser entre elles. L’aperçu charge uniquement les petits atlas dérivés : moins de 50 Ko au total pour les trois PNG d’atlas. Les grandes planches originales ne sont pas téléchargées par la scène. Pas de dépendance ajoutée, shader ou filtre supplémentaire.

Le rendu statique a été inspecté et le build validé. **Chrome Android doit encore être vérifié sur le téléphone**, aucun navigateur n’étant disponible dans l’environnement. Vérifier les quatre orientations, la marche/pause, la netteté des pixels et le retour au prototype. Aucune modification des déplacements, de la grille logique, de la caméra du jeu, des collisions, des dialogues ou des commandes tactiles.
