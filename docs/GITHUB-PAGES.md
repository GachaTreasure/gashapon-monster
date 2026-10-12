# V0.4 — sauvegarde et publication depuis Android

## État préparé, aucune publication effectuée

V0.4-STABLE contient les 122 fichiers de la version validée, vérifiés octet par octet avant adaptation Pages. node_modules, dist et les anciennes sauvegardes sont exclus. Les autres archives sont intactes.

Pour restaurer dans Acode : créer un dossier de travail distinct, y copier tout le contenu de V0.4-STABLE (y compris .gitignore), ouvrir ce dossier dans le terminal puis lancer npm ci et npm run dev. Utiliser une version Node 22.12 ou plus récente, idéalement Node 22 LTS. Ne pas recopier les anciennes dépendances.

Les sauvegardes du navigateur ne sont pas des fichiers du projet : localStorage conserve la progression et le drapeau d'introduction sur le téléphone, pour chaque origine. La copie du projet conserve tout le code de sauvegarde mais ne peut pas exporter automatiquement les données privées de Chrome Android. Le site GitHub Pages aura son propre stockage ; sa première visite lancera donc l'introduction. Revoir l'introduction ne redonne pas le compagnon familial.

## Configuration

- npm run dev : http://127.0.0.1:5173/ inchangé.
- npm run build : base /gashapon-monster/.
- npm run preview -- --port 4173 --strictPort : http://127.0.0.1:4173/gashapon-monster/.
- src/assetUrl.js utilise import.meta.env.BASE_URL pour les PNG, spritesheets, JSON et liens internes dynamiques. Les trois pages HTML restent disponibles ; Vite transforme leurs ressources selon la base.
- Liens promo : https://gacha-treasure.fr et https://osaka-treasure.com, y compris dans l'ancien aperçu indépendant.
- Aucune dépendance backend. Les outils Node d'importation restent locaux, hors dist.
- .gitignore exclut les archives locales, node_modules, dist, .env et fichiers de clés. Les fixtures des tests contiennent seulement des empreintes historiques et une petite carte logique de référence ; elles permettent de tester sans les sauvegardes STABLE.
- .github/workflows/pages.yml utilise Node 22, npm ci, les tests, le build, une vérification HTTP avec Vite Preview, puis publie uniquement dist. Déclenchement sur push de publication, ou lancement manuel sur cette branche uniquement. main ne déploie pas.

## Procédure depuis Chrome Android, après confirmation de publication

La méthode suivante utilise GitHub Codespaces dans le navigateur : aucun Git n'est requis dans Acode. Un quota Codespaces doit être disponible sur le compte ; arrêter le codespace après utilisation.

1. Dans Chrome, ouvrir https://github.com/new ; créer un dépôt public nommé exactement gashapon-monster, cocher Add a README file et garder main comme branche initiale.
2. Ouvrir Code → Codespaces → Create codespace on main. Activer « Version pour ordinateur » dans Chrome si les menus sont difficiles à atteindre.
3. Dans l'explorateur du codespace, à la racine du dépôt, utiliser Upload... (menu contextuel par appui long/clic secondaire) pour envoyer le fichier local /public/gashapon-monster/gashapon-monster-publication.tar.gz. Cette archive contient les sources préparées, pas les sauvegardes, dépendances ou dist. Si le sélecteur Android ne voit pas /public, utiliser Acode pour copier/exporter cette unique archive dans Téléchargements.
4. Ouvrir le terminal intégré du codespace à la racine du dépôt et exécuter séparément :

```sh
tar -xzf gashapon-monster-publication.tar.gz
node --version
npm ci
npm test
npm run build
git status --short
git add .github .gitignore README.md docs src public tests tools index.html intro-preview.html gba-preview.html vite.config.js package.json package-lock.json
git commit -m "Préparer Gashapon Monster V0.4 pour GitHub Pages"
git push origin main
```

Le terminal doit disposer de Node 22.12+ ou Node 24. Ne pas poursuivre npm ci avec un moteur trop ancien. Le push sur main ne publie pas le jeu. Vérifier dans GitHub que package.json et .github sont à la racine, et qu'aucun dossier STABLE ni secret n'est inclus.

5. Dans le dépôt GitHub, Settings → Pages → Build and deployment → Source : GitHub Actions.
6. Quand la publication est confirmée, dans le même terminal :

```sh
git switch -c publication
git push -u origin publication
```

Ce dernier push déclenche la première publication publique. Ne pas l'exécuter pendant la simple préparation.

7. Dans Actions, attendre le succès du workflow « Publier Gashapon Monster ». Ouvrir le lien affiché par le déploiement : https://VOTRE-PSEUDO.github.io/gashapon-monster/.
8. Vérifier la première visite, les six scènes, les cartouches et liens, A/B, la transition, Mila, la croix tactile, le portrait et le plein écran paysage. Recharger : le jeu doit démarrer directement. Le paramètre ?intro=first permet de revoir le premier lancement sans effacer la progression.
9. Arrêter le codespace depuis https://github.com/codespaces.

Pour une mise à jour volontaire ultérieure : préparer et tester sur main, puis dans le codespace git switch publication, git merge main et git push origin publication. Chaque push sur publication reconstruit et déploie dist.

## Vérifications locales

```sh
npm test
npm run build
npm run preview -- --port 4173 --strictPort
```

Dans un deuxième terminal :

```sh
node tools/verify-pages.mjs
```

Le vérificateur compare chaque fichier servi avec dist, valide les six PNG, les chemins de base et les liens. Il ne lance pas de navigateur : rendu WebGL, tactile et plein écran réels restent à tester sur Motorola. Ctrl+C arrête Vite Preview.

Références officielles :
- https://vite.dev/guide/static-deploy.html
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository?tool=webui
