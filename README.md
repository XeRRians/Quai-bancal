# Quai Bancal

Jeu d'entrepôt multijoueur à physique bancale, jouable dans le navigateur et sur téléphone.
Livre les colis sur le bon quai, embête tes collègues quand le patron a le dos tourné, et finis le service avec la meilleure note.

- Jusqu'à **8 joueurs** par partie, avec un code à 4 lettres.
- Gérard et Kévin, deux intérimaires pilotés par l'IA, peuvent compléter l'équipe.
- Mode solo disponible sans connexion au serveur.

## Le Goofball

Les personnages utilisent `goofball.glb` (modèle Meshy + animations Mixamo). Le jeu choisit l'animation selon ce que fait le perso
(repos, marche, course, porter, pousser, lancer, droite, coup reçu, étourdi, boire, conduire, saut) et ajoute un ballottement mou par-dessus.
La couleur achetée en boutique teinte le corps ; chapeaux et accessoires s'accrochent aux os de la tête et du torse.

**Roue d'emotes** : bouton ☺ ou touche **T** (puis 1 à 6 au clavier). On danse jusqu'à ce qu'on bouge… et danser sous les yeux du patron, c'est une bêtise.

Si `goofball.glb` ne se charge pas, le jeu reprend les anciens bonshommes.

## L'atelier

Les objets en vrac (vase, télé, poule, bocal, ordi) arrivent sans carton :

1. **Table d'emballage** : pose l'objet sur la table du bon matériau (papier bulle, caisse ajourée ou polystyrène) et tape vite pour scotcher. Mauvais matériau = colis fragile.
2. **Étiqueteuse** : reste une demi-seconde sur la dalle de la destination, pose le colis, puis imprime.
3. **Quai** : livre-le au quai de son étiquette. Vérifie qu'elle correspond au bon de commande, sinon c'est toi qui paies !

## Comment ça marche

- `index.html` : tout le jeu (Three.js + cannon.js chargés depuis un CDN).
- `server.js` : petit serveur Node qui sert la page et relaie les messages entre joueurs.
  Le téléphone de l'**hôte** calcule la physique, le patron et l'argent ; les autres reçoivent l'état environ 12 fois par seconde et envoient leurs commandes.
- `render.yaml` : configuration du service sur Render.

## Mettre en ligne sur Render (offre gratuite)

1. Sur [render.com](https://render.com), crée un compte et relie ton GitHub.
2. **New → Web Service**, choisis le dépôt `Quai-bancal`.
3. Réglages :
   - Runtime : **Node**
   - Build Command : `npm install`
   - Start Command : `npm start`
   - Instance Type : **Free**
   - Région : Frankfurt (la plus proche de la France)
4. Valide : au bout de quelques minutes, le jeu est en ligne sur une adresse du type `https://quai-bancal.onrender.com`.

Chaque nouveau commit sur la branche principale redéploie le jeu automatiquement.

> Offre gratuite : le service s'endort après 15 minutes sans activité. Le premier qui ouvre le lien attend environ une minute, ensuite tout le monde joue normalement.

## Jouer à plusieurs

1. Ouvre l'adresse du jeu et **entre dans le vestiaire**.
2. Va au **tableau des collègues**, écris ton pseudo, puis **Créer une partie**.
3. **Copier le lien** et envoie-le à tes potes (ou donne-leur le code à 4 lettres).
4. Choisis la nuit au **tableau des nuits**, passe aux **casiers** pour ta tenue.
5. Tout le monde devant la **grande porte** : elle s'ouvre au bout de 3 secondes et le service commence.

Astuce : sur téléphone, « Ajouter à l'écran d'accueil » pour jouer en plein écran comme une vraie appli.

## Tester en local

```bash
npm install
npm start
# puis ouvrir http://localhost:3000
```

Pour viser un autre serveur multi : `index.html?serveur=wss://mon-serveur/ws`.
