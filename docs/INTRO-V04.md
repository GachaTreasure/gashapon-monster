# Introduction V0.4 — cinématique Phaser plein cadre

## Architecture conservée

src/main.js enregistre IntroScene et Village dans le même Phaser.Game. Au premier lancement, IntroScene seule démarre. IntroScene.finish() attend le fondu puis appelle scene.start('Village'). En relecture, Village reste en veille puis reprend avec scene.wake('Village'). Le gameplay, les sauvegardes, les six PNG et les textes du récit restent inchangés.

## Présentation

IntroScene.preload() charge directement les six PNG sources /assets/intro/, chacun de 240 × 160 pixels. IntroScene.renderPage() affiche chaque texture en 240 × 160, centrée à (120,80). Aucune bande latérale, découpe, recompression ou modification des fichiers sources. Filtrage NEAREST explicite, antialiasing global désactivé, coordonnées logiques entières ; mise à l'échelle CSS responsive existante conservée.

composition.js définit une boîte superposée de 234 × 35 pixels à (3,123), fond opaque à 80 %. La police originale pixelFont.js utilise des glyphes bitmap 5 × 7 avec accents, dans des cellules de 6 × 10 pixels. Les trois textes sont des objets Phaser BitmapText. wrapMeasuredText() et paginateDialogue() assurent deux lignes maximum de 216 pixels ; les pages portent un compteur. Le texte apparaît progressivement. La scène promo reste sans boîte de dialogue. promoEndcard.js lui ajoute une bannière « Boutiques officielles » et deux cartouches bleus à bord doré, avec noms et domaines en BitmapText. Les cartouches ouvrent les sites en nouvel onglet avec noopener/noreferrer. Le panneau de liens HTML a été retiré ; la scène 6 utilise toute la place responsive disponible.

Toucher l'illustration ou appuyer sur Haut (croix tactile, clavier ou manette) masque/réaffiche le dialogue et suspend/reprend la frappe progressive. A réaffiche d'abord la même page sans avancer. B reste disponible pour passer. Les commandes tactiles A/B restent identiques. Aucun panneau HTML promotionnel : les deux boutiques sont des cartouches Phaser cliquables.

Comparaison indicative : tools/intro-fullframe-comparison.png, ancien cadrage à gauche, nouveau à droite, six scènes de haut en bas. Ce montage des PNG et des fonds de dialogue n'est pas une capture WebGL.

Une résolution cinématique supérieure demanderait un rendu dédié et une adaptation des coordonnées. Avec les sources actuelles déjà en 240 × 160, elle ne restituerait aucun détail supplémentaire ; il faudrait des originaux plus grands pour en profiter. Aucune modification de résolution n'est appliquée.

## Validation sur Motorola

1. npm run dev puis http://127.0.0.1:5173/?intro=first : mode test sans effacer les sauvegardes.
2. Parcourir les six scènes avec A, vérifier le plein cadre, les accents, les deux lignes, les pages et les fondus.
3. Toucher l'image pendant la frappe : dialogue masqué ; A doit retrouver la même page sans avancer.
4. Vérifier B / Passer, les liens promotionnels et la transition vers le village jouable.
5. Répéter en portrait et plein écran paysage ; essayer Revoir l'introduction.

Les tests automatisés simulent les objets Phaser et les événements ; ils ne remplacent pas une vérification WebGL réelle dans Chrome Android. Les sauvegardes stables précédentes sont préservées. L'aperçu HTML indépendant historique reste disponible, sans être utilisé au lancement principal.

## Netteté de la scène 6

Le PNG original 06-promo.png reste inchangé et affiché en 240 × 160, filtrage NEAREST. Un ShaderQuad Phaser 4 superpose uniquement sur cette image une accentuation légère (cinq échantillons voisins, force 0,36, correction limitée à ±0,06). Aucun redimensionnement permanent ni traitement des cinq autres illustrations. Le PNG original reste sous le shader. Cette accentuation améliore le contraste local mais ne recrée pas les détails déjà absents de la source. Elle ajoute un seul petit rendu GPU sur la scène finale.

Les tests vérifient la présence exclusive sur la scène 6, les domaines, les clics, A/B et la transition réelle vers Village via le gestionnaire de scènes simulé. La compilation WebGL du shader et son résultat sur Motorola doivent encore être vérifiés dans Chrome Android, en portrait et plein écran paysage.

Les cartouches de la scène 6 affichent Gacha Treasure / gacha-treasure.fr et Osaka Treasure / osaka-treasure.com. Les titres dorés sont prioritaires ; les domaines bleu clair restent centrés, en pixels entiers, sans réduire la police bitmap. Le clic Osaka utilise également le domaine .com.
