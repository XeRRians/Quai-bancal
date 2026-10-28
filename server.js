// Quai Bancal — serveur web + relais multijoueur
// Le serveur ne calcule pas le jeu : le téléphone de l'hôte fait la physique,
// le serveur relaie simplement les messages entre l'hôte et les autres joueurs.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
// Fichiers servis au navigateur (tout est à la racine du dépôt pour pouvoir l'envoyer depuis un téléphone)
const PUBLICS = new Set(['/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png']);
const MAX_JOUEURS = 8;
const TAILLE_MAX_MESSAGE = 64 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// ---------- Fichiers statiques ----------
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/sante') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('ok ' + salons.size + ' salon(s)');
    return;
  }
  let fichier = url.pathname;
  if (fichier === '/') fichier = '/index.html';
  if (!PUBLICS.has(fichier)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Introuvable'); return; }
  const complet = path.join(__dirname, fichier.slice(1));
  fs.readFile(complet, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Introuvable'); return; }
    const ext = path.extname(complet).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(data);
  });
});

// ---------- Salons ----------
// salon = { code, hote: idJoueur, joueurs: Map<id, {ws, id, nom, look, bonus}>, ouvert }
const salons = new Map();
let prochainId = 1;

function genererCode() {
  const lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans I ni O pour éviter les confusions
  for (let essai = 0; essai < 50; essai++) {
    let c = '';
    for (let i = 0; i < 4; i++) c += lettres[Math.floor(Math.random() * lettres.length)];
    if (!salons.has(c)) return c;
  }
  return null;
}

function envoyer(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
}

function listeJoueurs(salon) {
  return [...salon.joueurs.values()].map(j => ({ id: j.id, nom: j.nom, look: j.look, bonus: j.bonus, hote: j.id === salon.hote }));
}

function diffuserSalon(salon) {
  const msg = JSON.stringify({ t: 'salon', code: salon.code, joueurs: listeJoueurs(salon), ouvert: salon.ouvert });
  for (const j of salon.joueurs.values()) envoyer(j.ws, msg);
}

function nettoyerTexte(s, max) {
  return String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
}

function nettoyerLook(l) {
  l = l && typeof l === 'object' ? l : {};
  return {
    vest: Number.isFinite(l.vest) ? l.vest & 0xffffff : 0xff7a1a,
    head: nettoyerTexte(l.head, 16) || 'casque',
    acc: l.acc ? nettoyerTexte(l.acc, 16) : null
  };
}

function quitterSalon(ws) {
  const salon = salons.get(ws.salon);
  if (!salon) return;
  salon.joueurs.delete(ws.idJoueur);
  ws.salon = null;
  if (salon.hote === ws.idJoueur || salon.joueurs.size === 0) {
    // L'hôte part : la partie s'arrête pour tout le monde
    for (const j of salon.joueurs.values()) { envoyer(j.ws, { t: 'ferme', raison: "L'hôte a quitté la partie." }); j.ws.salon = null; }
    salons.delete(salon.code);
    return;
  }
  const hote = salon.joueurs.get(salon.hote);
  if (hote) envoyer(hote.ws, { t: 'depart', id: ws.idJoueur });
  diffuserSalon(salon);
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: TAILLE_MAX_MESSAGE });

wss.on('connection', ws => {
  ws.idJoueur = prochainId++;
  ws.salon = null;
  ws.enVie = true;
  ws.on('pong', () => { ws.enVie = true; });
  envoyer(ws, { t: 'bonjour', id: ws.idJoueur });

  ws.on('message', brut => {
    let m;
    try { m = JSON.parse(brut); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    const salon = salons.get(ws.salon);

    switch (m.t) {
      case 'creer': {
        if (salon) quitterSalon(ws);
        const code = genererCode();
        if (!code) { envoyer(ws, { t: 'erreur', msg: 'Trop de parties en cours, réessaie.' }); return; }
        const s = { code, hote: ws.idJoueur, joueurs: new Map(), ouvert: true };
        s.joueurs.set(ws.idJoueur, { ws, id: ws.idJoueur, nom: nettoyerTexte(m.nom, 16) || 'Hôte', look: nettoyerLook(m.look), bonus: Array.isArray(m.bonus) ? m.bonus.slice(0, 10).map(b => nettoyerTexte(b, 20)) : [] });
        salons.set(code, s);
        ws.salon = code;
        envoyer(ws, { t: 'entre', code, id: ws.idJoueur, hote: true });
        diffuserSalon(s);
        break;
      }
      case 'rejoindre': {
        const code = nettoyerTexte(m.code, 4).toUpperCase();
        const s = salons.get(code);
        if (!s) { envoyer(ws, { t: 'erreur', msg: 'Aucune partie avec ce code.' }); return; }
        if (s.joueurs.size >= MAX_JOUEURS) { envoyer(ws, { t: 'erreur', msg: 'La partie est complète (8 joueurs).' }); return; }
        if (salon) quitterSalon(ws);
        const j = { ws, id: ws.idJoueur, nom: nettoyerTexte(m.nom, 16) || 'Collègue', look: nettoyerLook(m.look), bonus: Array.isArray(m.bonus) ? m.bonus.slice(0, 10).map(b => nettoyerTexte(b, 20)) : [] };
        s.joueurs.set(ws.idJoueur, j);
        ws.salon = code;
        envoyer(ws, { t: 'entre', code, id: ws.idJoueur, hote: false });
        const hote = s.joueurs.get(s.hote);
        if (hote) envoyer(hote.ws, { t: 'arrivee', joueur: { id: j.id, nom: j.nom, look: j.look, bonus: j.bonus } });
        diffuserSalon(s);
        break;
      }
      case 'quitter':
        quitterSalon(ws);
        break;
      // Commandes d'un joueur -> hôte uniquement
      case 'cmd': {
        if (!salon || ws.idJoueur === salon.hote) return;
        const hote = salon.joueurs.get(salon.hote);
        if (hote) envoyer(hote.ws, { t: 'cmd', id: ws.idJoueur, d: m.d });
        break;
      }
      // État du jeu envoyé par l'hôte -> tous les autres joueurs
      case 'etat': {
        if (!salon || ws.idJoueur !== salon.hote) return;
        const msg = JSON.stringify({ t: 'etat', d: m.d });
        for (const j of salon.joueurs.values()) if (j.id !== salon.hote) envoyer(j.ws, msg);
        break;
      }
      // Un joueur change de tenue au vestiaire
      case 'tenue': {
        if (!salon) return;
        const j = salon.joueurs.get(ws.idJoueur);
        if (!j) return;
        j.look = nettoyerLook(m.look);
        j.bonus = Array.isArray(m.bonus) ? m.bonus.slice(0, 10).map(b => nettoyerTexte(b, 20)) : [];
        diffuserSalon(salon);
        break;
      }
      case 'ouvert': {
        if (!salon || ws.idJoueur !== salon.hote) return;
        salon.ouvert = !!m.v;
        diffuserSalon(salon);
        break;
      }
    }
  });

  ws.on('close', () => quitterSalon(ws));
  ws.on('error', () => {});
});

// Battement de cœur : coupe les connexions mortes et garde le service éveillé pendant une partie
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.enVie) { ws.terminate(); continue; }
    ws.enVie = false;
    try { ws.ping(); } catch (e) {}
  }
}, 25000);

server.listen(PORT, () => console.log(`Quai Bancal en ligne sur le port ${PORT}`));
