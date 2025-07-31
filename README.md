# Gestion de Stock App

Ce projet est une application web de gestion de stock, optimisée pour mobile, avec ajout de produits par photo, détection automatique de couleur et taille, et saisie vocale.

## Déploiement rapide sur GitHub Pages (HTTPS)

### 1. Pré-requis
- Un compte GitHub (https://github.com)
- Git installé sur votre ordinateur

### 2. Création du dépôt GitHub
1. Créez un nouveau dépôt sur GitHub (ex : `gestion-stock-app`).
2. Notez l'URL du dépôt (ex : `https://github.com/votre-utilisateur/gestion-stock-app.git`).

### 3. Préparation des fichiers
Placez tous les fichiers de l'application (`index.html`, `app.js`, `style.css`, etc.) dans un dossier sur votre ordinateur.

### 4. Initialisation et envoi du code
Ouvrez un terminal dans ce dossier et exécutez :

```sh
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/votre-utilisateur/gestion-stock-app.git
git push -u origin main
```
(Remplacez `votre-utilisateur` par votre nom GitHub)

### 5. Activation de GitHub Pages
1. Sur GitHub, allez dans les **Settings** du dépôt.
2. Dans la section **Pages**, choisissez la branche `main` et le dossier `/` (root).
3. Cliquez sur **Save**.
4. Après quelques minutes, votre app sera disponible à l’adresse :
   
   `https://votre-utilisateur.github.io/gestion-stock-app/`

### 6. Conseils
- Toute modification : `git add . && git commit -m "update" && git push`
- L’application sera toujours servie en HTTPS, compatible iPhone/iPad.

---

## Fonctionnalités principales
- Ajout manuel, par scan, par photo, ou par voix
- Détection automatique de la couleur (Color Thief)
- Détection automatique de la taille (Tesseract.js)
- PWA : installable sur mobile

---

Pour toute question, ouvrez une issue sur le dépôt ou contactez le développeur.
