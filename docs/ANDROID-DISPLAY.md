# V0.3 — ergonomie Android

La version précédente est conservée intégralement dans `V0.3-PRE-ERGONOMIE`, sans `node_modules`, `dist` ni copies imbriquées des sauvegardes. Les deux anciennes sauvegardes restent intactes.

## Affichage

La résolution Phaser reste **240 × 160**. Aucun appel à `game.scale.resize`, changement de caméra, de carte, de sprite ou de collision. Seules les dimensions CSS du canvas et de son conteneur changent. La transformation des coordonnées d’entrée Phaser est mise à jour avec les dimensions affichées.

En portrait, la largeur vise 98 % de la fenêtre, avec au moins 4 pixels de marge de chaque côté et les éventuels insets Android. Le bandeau est réduit à 36 pixels, la ligne du village à 17 pixels, les commandes suivent l’écran après 8 pixels. Croix de 52 pixels par touche et boutons A/B de 64 pixels sur un téléphone de largeur normale. Le canvas n’est plus limité au facteur entier 1× qui le maintenait à 240 pixels de large.

En paysage, les commandes occupent deux bandes latérales de 132 à 156 pixels. La carte reste intégralement visible au centre, sans bouton superposé. Le haut de l’écran garde une barre compacte de 40 pixels pour le plein écran, le debug et les coordonnées. La zone centrale utilise le maximum disponible en conservant le ratio 3:2.

Le bouton **Plein écran** demande le plein écran pour toute la console, avec ses commandes. Il devient **Quitter le plein écran**. Une sortie via le système remet également son état à jour. En cas d’indisponibilité ou de refus, un message s’affiche et le jeu reste utilisable en paysage normal. Aucun verrouillage d’orientation n’est demandé. Référence API : https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen

`visualViewport`, les événements de redimensionnement, les changements de plein écran et l’observation du conteneur déclenchent un nouveau calcul. `viewport-fit=cover` et les insets CSS évitent les zones système. Une rotation efface les boutons maintenus pour éviter de poursuivre une marche après l’annulation d’un toucher. Les contrôles eux-mêmes restent inchangés.

La croix, A/B et le canvas ont `touch-action: none` ; le défilement d’un doigt sur les commandes ne fait pas glisser la page. Les autres boutons restent accessibles au toucher. Le clavier et la manette sont conservés.

## Netteté et dimensions calculées

`pixelArt`, `roundPixels`, l’absence d’antialiasing et `image-rendering: pixelated` restent actifs. L’agrandissement peut être fractionnaire : à largeur presque pleine, les pixels logiques peuvent occuper des nombres légèrement différents de pixels physiques. Il n’y a pas de filtrage flou, mais un zoom entier n’est pas garanti. Imposer un zoom entier reproduirait la petite fenêtre initiale. Les dimensions extérieures sont arrondies sur les pixels physiques, avec un ratio exactement 3:2.

Ces exemples sont des fenêtres CSS simulées, **pas des mesures du Motorola** :

| Fenêtre CSS | DPR du test | Canvas CSS obtenu |
| --- | --- | --- |
| 360 × 780 | 3 | 352 × 234,67 |
| 393 × 800 | 2,75 | 384 × 256 |
| 412 × 820 | 2,625 | 403,43 × 268,95 |
| 800 × 360 | 3 | 462 × 308, commandes latérales |
| 800 × 400 | 3 | 498 × 332, commandes latérales |

Les exemples utilisent des marges de 4 pixels, sans inset supplémentaire. À 393 pixels de large, le canvas passe de 240 à 384 pixels de large : +60 % et une surface multipliée par 2,56. Les dimensions réelles varient avec les barres Chrome, le réglage de taille d’affichage Android, les zones sûres et le DPR.

## Validation

Les tests vérifient le remplissage portrait, le ratio, les limites du conteneur, les bandes latérales, les zones sûres, le redimensionnement lors des changements de barres/orientation, l’entrée et la sortie du plein écran ainsi que son refus. Les simulations garantissent que le canvas logique reste 240 × 160 et que tous les fichiers graphiques et systèmes de gameplay sont identiques à la sauvegarde.

Aucun navigateur n’est disponible ici : l’essai réel Chrome Android reste nécessaire. Recharger `http://127.0.0.1:5173/`, puis vérifier :

1. Portrait : écran presque pleine largeur, commandes immédiatement dessous, maintien et multitouch sans déplacement de page.
2. Rotation : image entière sans déformation, croix à gauche et A/B à droite, aucun bouton masquant la carte.
3. Plein écran : entrée, bouton de sortie, sortie système et retour au portrait ; garder le dialogue et le debug utilisables.
4. Netteté, fluidité, absence de débordement et adaptation lorsque les barres Chrome changent de taille.
