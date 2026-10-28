# Quai Bancal

Jeu d'entrepôt multijoueur à physique bancale, jouable dans le navigateur et sur téléphone.
Livre les colis sur le bon quai, embête tes collègues quand le patron a le dos tourné, et finis le service avec la meilleure note.

- Jusqu'à **8 joueurs** par partie, avec un code à 4 lettres.
- Gérard et Kévin, deux intérimaires pilotés par l'IA, peuvent compléter l'équipe.
- Mode solo disponible sans connexion au serveur.

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

1. Ouvre l'adresse du jeu, écris ton pseudo, puis **Créer une partie**.
2. Appuie sur **Copier le lien** et envoie-le à tes potes (ou donne-leur le code à 4 lettres).
3. Quand tout le monde est dans le vestiaire, **Lancer le service**.

Astuce : sur téléphone, « Ajouter à l'écran d'accueil » pour jouer en plein écran comme une vraie appli.

## Tester en local

```bash
npm install
npm start
# puis ouvrir http://localhost:3000
```

Pour viser un autre serveur multi : `index.html?serveur=wss://mon-serveur/ws`.
