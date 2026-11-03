# PROJET_CONTEXTE — Moneta

> Document de référence du projet. Toute décision figée est en section 6.
> Ce qui n'est pas écrit ici n'est pas décidé : on demande à Kinder.

Dernière mise à jour : 2026-11-03 — fin de la phase 3 (figeage).

---

## 1. Vision

Moneta est une application mobile Android de **comptes personnels en saisie manuelle**.
L'utilisateur note lui-même ses dépenses et ses revenus, les range par catégories,
suit ses porte-monnaie, ses budgets, ses dépenses récurrentes et l'argent qu'on lui doit.

- Aucune connexion bancaire, jamais.
- Fonctionne entièrement hors ligne ; les données restent sur le téléphone.
- Rapide et légère : seulement les écrans réellement utiles.
- Inspirée de l'usage de Money Lover, **sans en reprendre** ni les icônes, ni la mise en page exacte, ni les textes.

Usage d'abord personnel (Kinder), avec l'objectif d'une publication sur le Play Store en version finale.

## 2. Utilisateur et usage

- Utilisateur principal : Kinder, qui saisit ses opérations au fil de l'eau sur son téléphone.
- Il valide chaque étape par capture d'écran.
- Il possède un historique dans Money Lover, à importer (voir section 4.9).
- Usage sur ordinateur souhaité, mais **secondaire** : dernière version.

## 3. Socle technique

Socle existant **« Application locale React »** :
React + Vite + Capacitor + sql.js, hors ligne, données sur l'appareil.
Seule exception autorisée : sauvegarde dans le Google Drive personnel de l'utilisateur,
jamais vers un serveur de l'éditeur.

- Distribution : Android.
- Limites du projet : 20 modules maximum, 5 fichiers de documentation maximum,
  3 couches (Interface / Logique / Données), aucune structure vide « pour le futur ».
- **Aucune dépendance ajoutée sans l'accord de Kinder.** Seule dépendance déjà validée
  au-delà du socle : l'accès à la galerie photo (pour les icônes personnalisées).
- Projet totalement indépendant de Vault Watch (même socle, aucun code ni donnée partagés).

## 4. Fonctionnalités (périmètre complet du produit)

### 4.1 Porte-monnaie
- L'utilisateur crée autant de porte-monnaie qu'il veut (ex. compte courant, épargne, espèces).
- Une vue « Tous les comptes » additionne les soldes ; on peut aussi n'en afficher qu'un.
- **Transfert** d'argent d'un porte-monnaie à un autre (ni dépense, ni revenu).

### 4.2 Opérations
- Dépense ou revenu, saisi à la main : montant, catégorie, porte-monnaie, date, note.
- Monnaie : **euro uniquement**.

### 4.3 Catégories
- Catégories et sous-catégories (deux niveaux), séparées entre dépenses et revenus.
- Une liste de départ est fournie comme **modèle** ; tout est modifiable par l'utilisateur :
  nom, icône, ajout, suppression, sous-catégories.
- Icônes : bibliothèque d'icônes libre de droits intégrée à l'application,
  **ou** image choisie dans la galerie du téléphone.

Liste de départ (modèle) :

| Type | Catégorie | Sous-catégories |
|---|---|---|
| Dépense | Alimentation | Courses, Restaurant, Fast-food, Café/Bar |
| Dépense | Logement | Loyer, Électricité, Eau, Internet/Téléphone, Assurance |
| Dépense | Transports | Transports en commun, Carburant, Stationnement, Entretien |
| Dépense | Santé | — |
| Dépense | Shopping | Vêtements, Maison, Électronique, Hygiène |
| Dépense | Loisirs | Sorties, Jeux, Sport, Vacances |
| Dépense | Abonnements | — |
| Dépense | Cadeaux | — |
| Dépense | Frais bancaires | — |
| Dépense | Divers | — |
| Revenu | Salaire | — |
| Revenu | Prime | — |
| Revenu | Remboursement | — |
| Revenu | Vente | — |
| Revenu | Cadeau reçu | — |
| Revenu | Autres | — |

### 4.4 Prêts (argent qu'on me doit)
- Uniquement l'argent prêté à une autre personne, qu'elle doit rembourser.
- Suivi : montant prêté, personne, remboursements reçus, reste dû.
- Pas de suivi de mes propres dettes.

### 4.5 Budgets
- Créés par l'utilisateur dans l'application.
- Un budget = un nom, une ou plusieurs catégories choisies, un **montant maximum**.
- Période mensuelle, qui démarre **le 1er du mois par défaut** ; le jour de départ est modifiable.
- On peut **exclure une dépense précise** du calcul d'un budget
  (ex. un gros achat exceptionnel en courses qui ne compte pas dans le budget Alimentation).
- Affichage : dépensé / maximum, avec une barre de progression.

### 4.6 Dépenses (et revenus) récurrents
- L'utilisateur déclare une opération récurrente mensuelle (montant, catégorie, porte-monnaie, jour prévu).
- Chaque mois, elle apparaît **« À valider »**.
- L'utilisateur la valide en confirmant la **date réelle d'encaissement** ;
  elle ne compte dans le solde qu'une fois validée.

### 4.7 Graphiques (deux seulement)
1. Répartition des dépenses du mois par catégorie (camembert) : « où part mon argent ».
2. Évolution du solde total, mois après mois : « est-ce que j'épargne ».

### 4.8 Sauvegarde
- Par défaut : tout reste sur le téléphone. Aucun compte, aucune inscription.
- Option dans les réglages : connexion Google pour sauvegarder dans le Drive de l'utilisateur.
- Une fois connectée, **chaque changement est envoyé automatiquement** dans le Drive.
- Hors connexion : l'envoi attend le retour du réseau, sans perte.

### 4.9 Import de l'historique Money Lover
- Mission à part, à partir d'un export Money Lover fourni par Kinder.
- Placée **juste après la saisie de base** (porte-monnaie, catégories, opérations),
  avant budgets et graphiques, pour tester ces derniers sur de vraies données.

### 4.10 Version ordinateur
- Utiliser Moneta sur PC avec les mêmes données (synchronisation via le Drive).
- **Dernière version** du projet : c'est la partie la plus délicate (modifications sur deux appareils).

### 4.11 Exclu
- Verrouillage à l'ouverture (empreinte ou code) : **non**.
- Plusieurs monnaies : non.
- Connexion bancaire : jamais.
- Suivi de mes propres dettes : non.

## 5. Charte graphique — piste A « Menthe claire »

Maquette de référence (écran d'accueil) : https://claude.ai/artifact/EPjjEzJ3CvzYuFy8MGXZQ2 (artboard « A · Menthe claire »).

| Rôle | Valeur |
|---|---|
| Fond de l'application | `#F4F7F6` |
| Cartes / surfaces | `#FFFFFF` |
| Texte principal | `#0F1A17` |
| Texte secondaire | `#4B5B56` |
| Couleur principale (boutons, onglet actif, barre de budget) | `#0F766E` |
| Couleur principale, survol / appui | `#115E59` |
| Fond doux (carte « À valider ») | `#E6F4F1` |
| Fond des barres de progression, séparateurs | `#E3ECE9` / `#EDF2F0` |
| Montant positif (entrées) | `#067647` |
| Montant négatif (sorties) | `#B42318` |

- Police : **Manrope** (400 à 800), embarquée dans l'application (pas de chargement en ligne).
- Solde total : 36 px, gras 800. Textes courants : 15 px. Libellés secondaires : 12–13 px.
- Cartes : coins arrondis 20 px, fond blanc sur fond menthe très clair.
- Icônes de catégorie : pastille carrée arrondie (12 px) de couleur douce, pictogramme au trait.
- Bouton « + » central : carré arrondi 56 px, couleur principale, légère ombre, en relief dans la barre du bas.
- Barre du bas : Accueil · Opérations · « + » · Budgets · Comptes.
- Zones tactiles : 44 px minimum. Contrastes lisibles (4,5:1 minimum pour le texte).

Écran d'accueil de référence (de haut en bas) : sélecteur de porte-monnaie + recherche ;
solde total ; carte du mois (entrées, sorties) ; carte de budget avec barre ;
carte « À valider » (récurrente) avec bouton Valider ; liste des opérations du jour ; barre du bas.

## 6. Décisions figées

| # | Décision | Date |
|---|---|---|
| D1 | Nom de l'application : **Moneta** (voir point ouvert P1). | 2026-11-02 |
| D2 | Socle : Application locale React (React + Vite + Capacitor + sql.js), Android, hors ligne. | 2026-11-02 |
| D3 | Aucune connexion bancaire ; saisie manuelle uniquement. | 2026-11-02 |
| D4 | Porte-monnaie multiples, vue « Tous les comptes », transferts entre porte-monnaie. | 2026-11-02 |
| D5 | Catégories / sous-catégories (2 niveaux) ; la liste de départ n'est qu'un modèle ; tout est modifiable. | 2026-11-02 |
| D6 | Icônes : bibliothèque libre de droits intégrée + ajout depuis la galerie. | 2026-11-02 |
| D7 | Dépendance validée par Kinder : accès à la galerie photo. Toute autre dépendance demande son accord. | 2026-11-02 |
| D8 | Prêts : uniquement l'argent qu'on me doit, avec remboursements reçus. | 2026-11-02 |
| D9 | Budgets : créés dans l'app, catégories choisies, montant maximum, période mensuelle démarrant le 1er par défaut (modifiable), exclusion possible d'une dépense précise. | 2026-11-02 |
| D10 | Récurrentes : « À valider » chaque mois, validation avec la date réelle d'encaissement ; ne comptent qu'une fois validées. | 2026-11-02 |
| D11 | Graphiques : répartition des dépenses du mois + évolution du solde. Rien d'autre sans demande. | 2026-11-02 |
| D12 | Euro uniquement. | 2026-11-02 |
| D13 | Sauvegarde locale par défaut ; Google Drive en option, envoi automatique à chaque changement, file d'attente hors connexion. Aucun compte requis. | 2026-11-02 |
| D14 | Pas de verrouillage à l'ouverture. | 2026-11-02 |
| D15 | Import Money Lover : étape dédiée juste après la saisie de base. | 2026-11-02 |
| D16 | Version ordinateur : dernière version du projet. | 2026-11-02 |
| D17 | Charte graphique : piste A « Menthe claire » (section 5). | 2026-11-02 |
| D18 | Inspiration Money Lover uniquement : aucune reprise de ses icônes, mise en page exacte ou textes. | 2026-11-02 |
| D19 | Projet indépendant de Vault Watch : aucun code, aucune donnée, aucun dépôt partagés. | 2026-11-02 |
| D20 | Plan du produit en 15 étapes ordonnées (section 9), validé par Kinder. | 2026-11-03 |

## 7. Points ouverts (à trancher au moment indiqué)

| # | Point | Quand |
|---|---|---|
| P1 | **Nom** : « Moneta » est aussi une banque tchèque (MONETA Money Bank) présente sur le Play Store ; « Monetico » est le service de paiement du Crédit Mutuel / CIC. Vérifier la disponibilité du nom avant publication (mission Recherche). | Avant la version publiée |
| P2 | Place des écrans Catégories, Prêts, Graphiques et Réglages dans la navigation (la barre du bas n'a que 4 onglets + « + »). | Phase 5 de l'étape concernée |
| P3 | Choix de la bibliothèque d'icônes libre de droits (dépendance à faire valider). | Phase 5 de l'étape catégories |
| P4 | Format exact de l'export Money Lover. | Phase 5 de l'étape import |
| P5 | Revue d'équipe Hermès (Chef, avec Recherche et Technique) sur la sauvegarde Google Drive, et mise à jour de la fiche du parc par Claude Code après accord de Kinder. | Avant l'étape sauvegarde Drive |

## 8. Méthode de travail

Six phases, aucune ne se saute : débroussaillage → réflexion → figeage → plan → cadrage d'étape → implémentation.
Phases 1 à 4 terminées le 2026-11-03. **Prochaine phase : 5 — Cadrage de l'étape 1** (critère de validation écrit par Kinder).

- Le plan découpe le produit en étapes ordonnées, chacune produisant quelque chose de visible à l'écran.
- Avant chaque étape : Kinder écrit en français le critère de validation (phase 5), avant toute ligne de code.
- Le test de code ferme une étape ; la capture d'écran ferme la mission.
- Résultats rendus en langage fonctionnel (critère réussi / échoué), jamais de logs bruts.
- Une étape à la fois.

## 9. Plan des étapes (phase 4, validé le 2026-11-03)

Chaque étape produit quelque chose de visible à l'écran. Une étape à la fois, dans cet ordre.

**Bloc A — Saisie de base**

| # | Étape | Ce que Kinder verra |
|---|---|---|
| 1 | Coquille de l'appli | Moneta s'ouvre sur le téléphone avec la charte et la police, et la barre du bas (Accueil · Opérations · + · Budgets · Comptes) ; écrans vides. |
| 2 | Porte-monnaie | Onglet Comptes : créer, renommer, supprimer un porte-monnaie avec solde de départ ; total « Tous les comptes ». |
| 3 | Catégories | Liste de départ avec sous-catégories, entièrement modifiable ; icônes de la bibliothèque intégrée (P2, P3). |
| 4 | Saisir une opération | Le « + » ouvre la saisie dépense/revenu (montant, catégorie, porte-monnaie, date, note) ; le solde change aussitôt. |
| 5 | Liste et accueil | Onglet Opérations : liste, modification, suppression, recherche. Accueil : solde, carte du mois, opérations du jour. |
| 6 | Transferts | Déplacer de l'argent entre deux porte-monnaie ; les deux soldes bougent, sans dépense ni revenu. |

**Bloc B — Import**

| # | Étape | Ce que Kinder verra |
|---|---|---|
| 7 | Import Money Lover | L'historique apparaît avec les bons soldes, catégories et dates (P4). |

**Bloc C — Le reste**

| # | Étape | Ce que Kinder verra |
|---|---|---|
| 8 | Budgets | Onglet Budgets : « dépensé / maximum » avec barre ; exclusion d'une dépense ; jour de départ modifiable. |
| 9 | Récurrentes | Carte « À valider » chaque mois ; validation avec la date réelle, le solde ne change qu'à ce moment. |
| 10 | Prêts | Écran de l'argent qu'on me doit : personne, montant, remboursements, reste dû (P2). |
| 11 | Graphiques | Camembert des dépenses du mois et courbe du solde mois après mois (P2). |
| 12 | Icônes depuis la galerie | Choisir une photo du téléphone comme icône de catégorie. |
| 13 | Réglages | Écran Réglages regroupant les options, dont l'entrée de la sauvegarde (P2). |
| 14 | Sauvegarde Google Drive | Après connexion Google : « dernière sauvegarde : à l'instant », fichier visible dans le Drive (P5 avant l'étape). |

**Bloc D — Version ordinateur**

| # | Étape | Ce que Kinder verra |
|---|---|---|
| 15 | Moneta sur PC | Moneta ouverte sur l'ordinateur avec les mêmes données que le téléphone. |

P1 (nom) se tranche avant la publication.
