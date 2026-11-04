# PROJET_CONTEXTE — Moneta

> Document de référence du projet. Toute décision figée est en section 6.
> Ce qui n'est pas écrit ici n'est pas décidé : on demande à Kinder.

Dernière mise à jour : 2026-11-03 — bloc A codé (phase 6), à vérifier sur téléphone.

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
- **Aucune dépendance ajoutée sans l'accord de Kinder.** Dépendances validées
  au-delà du socle : l'accès à la galerie photo (pour les icônes personnalisées), les icônes Lucide (D24)
  et la bibliothèque officielle Google de connexion (D33).
- Projet totalement indépendant de Vault Watch (même socle, aucun code ni donnée partagés).

### Organisation du code (état au 2026-11-04 : 19 modules sur 20)

| Couche | Modules | Rôle |
|---|---|---|
| Interface (`src/ui/`) | App, Accueil, Operations, Saisie, Comptes, Categories, Commun, Icones, Budgets, Recurrentes, Prets, Graphiques, Reglages | Écrans, barre du bas, panneaux de saisie |
| Logique (`src/logique/`) | argent, dates, importMoneyLover | Format des montants, totaux, regroupement par jour, recherche, dates, lecture de l'export Money Lover |
| Données (`src/donnees/`) | base, depot, sauvegarde | Base sql.js conservée sur l'appareil, lectures et écritures, sauvegarde et restauration Google Drive |

- Côté Android, un pont (`GoogleDrivePlugin.java`) obtient l'autorisation Google (D33) ; le fichier « Moneta - sauvegarde.sqlite » est envoyé directement au Drive.

- Montants enregistrés en centimes ; affichage au format français (1 234,56 €).
- La base évolue par étapes numérotées (`MIGRATIONS` dans `base.js`) : une mise à jour de l'appli ne perd jamais les données existantes.
- Données conservées dans le stockage interne du téléphone (IndexedDB de l'appli).
- Police Manrope intégrée (`public/polices/`), aucun chargement en ligne.
- Identifiant Android de l'appli : `fr.kinder.moneta` (définitif une fois publiée).
- Tests automatiques : `tests/` (27 tests au 2026-11-04).

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
| D21 | Méthode : Claude Code propose les critères de validation de toutes les étapes (section 10), Kinder les valide d'un bloc ; le code s'enchaîne ensuite sans attendre entre les étapes, avec un point de contrôle de Kinder sur le téléphone à la fin de chaque bloc (A, B, C, D). | 2026-11-03 |
| D22 | Critères de la section 10 validés, propositions comprises : suppression refusée d'un porte-monnaie ou d'une catégorie qui contient des opérations ; budget dépassé en rouge ; import sans doublons ; courbe du solde sur 12 mois ; en cas de modification sur deux appareils, la plus récente l'emporte. | 2026-11-03 |
| D23 | Navigation (P2, en partie) : l'écran Catégories est accessible depuis l'onglet Comptes, sous les porte-monnaie. | 2026-11-03 |
| D24 | Bibliothèque d'icônes (P3) : Lucide (licence ISC), dépendance validée par Kinder. Seules les icônes proposées dans l'appli y sont intégrées. | 2026-11-03 |
| D25 | Point de contrôle de fin de bloc (remplace celui de D21) : vérification par une autre IA sur le téléphone virtuel Android du PC, avec capture et verdict par critère. Kinder installe l'appli sur son vrai téléphone une seule fois, à la fin du projet. | 2026-11-03 |
| D26 | Import Money Lover (P4 tranché sur l'export réel du 2026-11-03 : fichier CSV, colonnes ID, Note, Amount, Category, Account, Currency, Date JJ/MM/AAAA, Event, Exclude Report). Bouton d'import dans l'onglet Comptes, sous Catégories. Catégories reprises telles quelles : rattachées à une catégorie Moneta de même nom (majuscules, accents et ponctuation ignorés), sinon créées. Opérations datées après le jour de l'import non importées (elles relèvent des récurrentes, étape 9). L'événement est ajouté à la note. Réimporter le même fichier n'ajoute rien, les doubles réels de l'historique sont gardés. Solde de contrôle : Caisse D'épargne 649,54 € au 2026-11-03, confirmé par Kinder. | 2026-11-03 |
| D27 | Navigation (P2 tranché) : Prêts = rubrique de l'onglet Comptes, sous Récurrentes ; Graphiques = s'ouvrent en touchant la carte du mois de l'accueil ; Réglages = bouton roue dentée en haut de l'onglet Comptes, regroupant Import Money Lover, Sauvegarde et version de l'appli (Catégories reste aussi dans Comptes, D23). Récurrentes : rubrique de l'onglet Comptes. | 2026-11-03 |
| D28 | Prêts (P7 tranché) : un prêt fait baisser le solde du porte-monnaie d'où part l'argent, un remboursement fait monter celui où il arrive ; ni l'un ni l'autre ne compte dans les entrées et sorties du mois ni dans les budgets. L'import Money Lover ne crée pas de prêts. | 2026-11-03 |
| D29 | Icône depuis la galerie (étape 12, critère 1) : le choix passe par le sélecteur de photos d'Android, qui ne demande aucune autorisation ; écart avec le critère accepté par Kinder. | 2026-11-04 |
| D30 | P5 abandonné : pas de revue Hermès avant la sauvegarde Google Drive. | 2026-11-04 |
| D31 | P8 tranché : la restauration des données depuis le Drive (ex. nouveau téléphone) fait partie de l'étape 14. | 2026-11-04 |
| D32 | Critères de restauration 14.5 à 14.7 (section 10) validés par Kinder. | 2026-11-04 |
| D33 | Dépendance validée par Kinder : bibliothèque officielle Google de connexion (Google Play services), reliée à Moneta par un pont écrit dans le projet, pour autoriser l'accès aux seuls fichiers créés par Moneta dans le Drive. | 2026-11-04 |

## 7. Points ouverts (à trancher au moment indiqué)

| # | Point | Quand |
|---|---|---|
| P1 | **Nom** : « Moneta » est aussi une banque tchèque (MONETA Money Bank) présente sur le Play Store ; « Monetico » est le service de paiement du Crédit Mutuel / CIC. Vérifier la disponibilité du nom avant publication (mission Recherche). | Avant la version publiée |
| P9 | Version ordinateur : forme (appli dans le navigateur ou installée) et règle en cas de modification sur les deux appareils. | Avant l'étape 15 |

## 8. Méthode de travail

Six phases, aucune ne se saute : débroussaillage → réflexion → figeage → plan → cadrage d'étape → implémentation.
Phases 1 à 5 terminées le 2026-11-03 (critères validés). **Phase en cours : 6 — Implémentation, bloc C.**

**Avancement (2026-11-03)**

| Bloc | État |
|---|---|
| A — Saisie de base (étapes 1 à 6) | **Terminé** : vérifié par une autre IA sur le téléphone virtuel (D25), 4 défauts corrigés et revérifiés, fusionné dans la branche principale le 2026-11-03. À revoir sur le vrai téléphone à la fin : format de la date (téléphone virtuel en anglais), icône de l'appli. |
| B — Import (étape 7) | **Terminé** : vérifié par une autre IA avec le vrai export (1 858 opérations, solde 649,54 €), fusionné dans la branche principale le 2026-11-03. À noter : l'import a créé des catégories proches de celles du modèle (Abonnement / Abonnements, Bar / Café/Bar). |
| C — Le reste (étapes 8 à 14) | En cours sur la branche `bloc-c`. Étapes 8 à 13 codées (budgets, récurrentes, prêts, graphiques, icône depuis la galerie, réglages), 25 tests réussis, vérifiées sur le téléphone virtuel le 2026-11-04 : tous les critères réussis (écart de l'étape 12 accepté, D29). Étape 14 codée (sauvegarde automatique, attente hors connexion, restauration), 27 tests réussis ; à vérifier après la préparation du projet Google par Kinder. |
| D — Ordinateur (étape 15) | Pas commencé. Avant de coder : P9. |

Fabrication de l'appli : `npm run android`, puis `gradlew assembleDebug` dans `android/` avec le Java d'Android Studio. Téléphone virtuel : `Medium_Phone_API_36.1`.

- Le plan découpe le produit en étapes ordonnées, chacune produisant quelque chose de visible à l'écran.
- Critères de validation : proposés par Claude Code, validés par Kinder avant toute ligne de code (D21, section 10).
- Code enchaîné bloc par bloc ; point de contrôle de Kinder sur le téléphone à la fin de chaque bloc.
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
| 14 | Sauvegarde Google Drive | Après connexion Google : « dernière sauvegarde : à l'instant », fichier visible dans le Drive ; restauration sur un autre téléphone (D31). |

**Bloc D — Version ordinateur**

| # | Étape | Ce que Kinder verra |
|---|---|---|
| 15 | Moneta sur PC | Moneta ouverte sur l'ordinateur avec les mêmes données que le téléphone. |

P1 (nom) se tranche avant la publication.

## 10. Critères de validation par étape

> Proposés par Claude Code et **validés par Kinder le 2026-11-03**, propositions comprises (décisions D21, D22).
> Chaque critère se vérifie à l'écran, sans lire de code. Les « propositions » sont validées et valent règle.

**Valables pour toutes les étapes**
- Tout fonctionne en mode avion.
- Après fermeture complète et réouverture de l'appli, tout ce qui a été saisi est toujours là.
- Les écrans respectent la charte « Menthe claire » (section 5) ; montants au format français (1 234,56 €).

### Bloc A — Saisie de base

**Étape 1 — Coquille de l'appli**
1. Moneta s'installe sur le téléphone Android ; son nom « Moneta » apparaît sous son icône.
2. À l'ouverture : fond menthe très clair, textes en police Manrope.
3. La barre du bas montre Accueil · Opérations · « + » · Budgets · Comptes ; le « + » est un carré vert arrondi en relief.
4. Toucher chaque onglet affiche un écran différent avec son titre ; l'onglet actif est en vert.

**Étape 2 — Porte-monnaie**
1. Dans Comptes, je crée un porte-monnaie (nom + solde de départ) ; il apparaît dans la liste avec son solde.
2. Je peux le renommer, changer son solde de départ, le supprimer après une demande de confirmation.
3. Le total « Tous les comptes » est égal à la somme des soldes.
4. En haut de l'accueil, le sélecteur permet d'afficher « Tous les comptes » ou un seul porte-monnaie.
5. Proposition (P6) : un porte-monnaie qui contient des opérations ne peut pas être supprimé ; un message l'explique.

**Étape 3 — Catégories** — à trancher avant : P2 (où se trouve l'écran) et P3 (bibliothèque d'icônes)
1. La liste de départ (section 4.3) s'affiche, séparée en Dépenses et Revenus, les sous-catégories sous leur catégorie.
2. J'ajoute, renomme, supprime une catégorie ou une sous-catégorie.
3. Je change l'icône d'une catégorie en la choisissant dans la bibliothèque ; elle s'affiche dans une pastille carrée arrondie.
4. Proposition (P6) : une catégorie utilisée par des opérations ne peut pas être supprimée ; un message l'explique.

**Étape 4 — Saisir une opération**
1. Le « + » ouvre la saisie : Dépense ou Revenu, montant en euros, catégorie (ou sous-catégorie), porte-monnaie, date (aujourd'hui par défaut), note facultative.
2. Après enregistrement, le solde du porte-monnaie et le total baissent (dépense) ou montent (revenu) du montant saisi.
3. Sans montant ou sans catégorie, l'enregistrement est refusé avec un message clair.

**Étape 5 — Liste et accueil**
1. L'onglet Opérations liste toutes les opérations, regroupées par jour, les plus récentes en haut ; dépenses en rouge, revenus en vert.
2. Toucher une opération permet de la modifier ou de la supprimer ; les soldes se recalculent.
3. La loupe permet de retrouver une opération par sa note ou sa catégorie.
4. Le sélecteur de porte-monnaie filtre la liste et l'accueil.
5. L'accueil montre, comme la maquette : solde total, carte du mois (entrées et sorties du mois en cours), opérations du jour. Les cartes Budget et « À valider » arrivent aux étapes 8 et 9.

**Étape 6 — Transferts**
1. Dans la saisie, un choix « Transfert » : porte-monnaie de départ, d'arrivée, montant, date.
2. Le départ baisse, l'arrivée monte, le total « Tous les comptes » ne change pas.
3. Le transfert ne compte ni dans les entrées ni dans les sorties de la carte du mois.
4. Il apparaît dans la liste des opérations avec un aspect distinct (ni rouge ni vert).

→ **Point de contrôle** (D25) : vérification du bloc A par une autre IA sur le téléphone virtuel.

### Bloc B — Import

**Étape 7 — Import Money Lover** — à trancher avant : P4 (format, à partir d'un vrai export fourni par Kinder)
1. Un bouton « Importer depuis Money Lover » permet de choisir le fichier d'export sur le téléphone (emplacement : voir P2).
2. Après import, un résumé affiche le nombre d'opérations, de porte-monnaie et de catégories importés.
3. Les soldes de 2 ou 3 porte-monnaie choisis par Kinder sont identiques à ceux de Money Lover à la date de l'export.
4. Quelques opérations témoins choisies par Kinder ont la même date, le même montant, la même catégorie et la même note.
5. Proposition : importer deux fois le même fichier ne crée pas de doublons.

→ **Point de contrôle Kinder** : vérification de l'import sur ses vraies données.

### Bloc C — Le reste

**Étape 8 — Budgets**
1. Dans Budgets, je crée un budget : nom, catégories cochées, montant maximum ; jour de départ le 1er par défaut, modifiable.
2. Chaque budget affiche « dépensé / maximum » avec sa barre de progression.
3. Proposition : en cas de dépassement, la barre et le montant passent en rouge.
4. Je peux exclure une dépense précise d'un budget ; le montant dépensé baisse d'autant.
5. Au jour de départ suivant, le budget repart à zéro.
6. L'accueil affiche une carte budget, comme sur la maquette.

**Étape 9 — Récurrentes**
1. Je déclare une opération récurrente mensuelle : dépense ou revenu, montant, catégorie, porte-monnaie, jour prévu.
2. Chaque mois, une carte « À valider » (fond vert doux) apparaît sur l'accueil avec un bouton Valider.
3. Tant qu'elle n'est pas validée, aucun solde ne change.
4. Valider demande la date réelle d'encaissement (jour prévu proposé) ; l'opération apparaît alors dans la liste à cette date et le solde change.
5. La liste des récurrentes permet de les modifier ou de les supprimer.

**Étape 10 — Prêts** — à trancher avant : P2 (où se trouve l'écran) et P7 (effet sur le solde)
1. Je crée un prêt : personne, montant, date.
2. J'ajoute des remboursements reçus ; le reste dû = montant prêté − remboursements.
3. Un prêt entièrement remboursé est marqué « Remboursé ».

**Étape 11 — Graphiques** — à trancher avant : P2 (où se trouve l'écran)
1. Le camembert montre la répartition des dépenses du mois par catégorie, avec montants et pourcentages ; je peux changer de mois.
2. La courbe montre le solde total en fin de mois. Proposition : sur les 12 derniers mois.
3. Pour un mois choisi par Kinder, les montants du camembert correspondent à la liste des opérations.

**Étape 12 — Icônes depuis la galerie**
1. En changeant l'icône d'une catégorie, je peux choisir une photo de la galerie ~~; le téléphone demande l'autorisation la première fois~~ (D29 : aucune autorisation demandée par le sélecteur de photos d'Android).
2. La photo s'affiche dans la pastille de la catégorie partout dans l'appli (liste, opérations, graphiques).

**Étape 13 — Réglages** — à trancher avant : P2 (où se trouve l'écran)
1. Un écran Réglages est accessible et regroupe les options. Proposition : Catégories, Import Money Lover, Sauvegarde, version de l'appli.

**Étape 14 — Sauvegarde Google Drive** — restauration incluse (D31)
1. Sans connexion Google, toute l'appli fonctionne ; aucun compte n'est jamais demandé.
2. Dans Réglages, je me connecte à Google ; l'écran affiche « Dernière sauvegarde : à l'instant ».
3. Après une modification, le fichier de sauvegarde Moneta est mis à jour dans mon Drive (date visible dans Drive).
4. En mode avion, une modification est marquée « en attente » ; au retour du réseau, elle part seule et l'écran revient à « à l'instant ».
5. Sur un téléphone où Moneta vient d'être installée, après connexion au même compte Google dans Réglages, Moneta propose « Restaurer la sauvegarde du [date] » ; après confirmation, porte-monnaie, opérations, catégories (icônes comprises), budgets, récurrentes et prêts réapparaissent, avec les mêmes soldes.
6. Si le téléphone contient déjà des données, une confirmation annonce clairement que la restauration remplace ce qu'il y a sur le téléphone ; en cas de refus, rien ne change.
7. Un bouton « Restaurer depuis le Drive » reste disponible à tout moment dans Réglages.

→ **Point de contrôle Kinder** : vérification du bloc C sur le téléphone.

### Bloc D — Version ordinateur

**Étape 15 — Moneta sur PC** — à trancher avant : P9 (forme et règle de conflit)
1. Moneta s'ouvre sur l'ordinateur et, après connexion au même compte Google, affiche les mêmes porte-monnaie, opérations et soldes que le téléphone.
2. Une opération ajoutée sur le PC apparaît sur le téléphone, et inversement.
3. Proposition : si le même élément est modifié sur les deux appareils, la modification la plus récente l'emporte.

→ **Point de contrôle Kinder** : vérification finale sur les deux appareils.
