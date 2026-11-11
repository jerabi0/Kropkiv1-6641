# Kropki — Arena sombre

## Direction
Refonte de la version existante : interface de plateforme de jeu inspirée de la disposition de Chess.com, sans logo, textes ou assets copiés. Identité propre Kropki. L’utilisateur a validé de commencer par le design ; aucune fonction en ligne ajoutée à cette étape.

## Palette et typographie
Fond #262522, menu #1f1e1b, panneaux #302f2b, traits #45443e. Texte #f0eee8, texte secondaire #a7a59b. Vert action #9bc35d (ombre #648532), plateau vert doux #c2d1a8 / #b8c89d. Points bleus #406be1 et rouges #e46a58 conservés. Corps et titres Poppins, serif seulement dans l’exemple de règles.

## Composition
Menu latéral fixe de 184px à gauche, avec navigation fonctionnelle Jouer, Ordinateur, À deux et Règles. En-tête compact de partie. Centre : plateau quadrillé Kropki avec coordonnées et bandeaux des joueurs au-dessus et dessous. À droite : panneau scores, modes, historique réel des coups, commandes de partie. Aucun faux classement, compte ou nombre de joueurs.
Mobile : menu compact en haut, plateau puis panneau empilé. Cibles de commandes de 40px minimum. Contraste lisible, mouvements subtils, focus visible.

## Fonctionnalités préservées
Moteur lib/kropki.ts inchangé : captures, libérations, deux modes, deux niveaux, trois tailles, fin, annulation, sauvegarde locale kropki-v1. Dialogues de règles/nouvelle partie/fin restylés. Historique lecture seule, coordonnées réelles.

## Fichiers
packages/web/src/web/pages/game.tsx, styles.css, index.html, public/kropki-icon.svg. Aucun changement API, DB, auth ou moteur.
