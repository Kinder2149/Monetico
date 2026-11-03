# CHANGELOG — Moneta

## 2026-11-03 — Bloc B, import Money Lover (phases 5 et 6)

- Export réel analysé : 1 866 opérations, un compte, 49 catégories, 8 opérations à venir. P4 tranché.
- D26 : règles de l'import validées par Kinder (emplacement, catégories, opérations à venir, événement, doublons, solde de contrôle 649,54 €).

## 2026-11-03 — Reprise sur le PC principal (phase 6, bloc A)

- Dépôt récupéré depuis GitHub ; 12 tests réussis ; fichier d'installation fabriqué et lancé sur le téléphone virtuel Android.
- D25 : point de contrôle de fin de bloc par une autre IA sur le téléphone virtuel ; installation sur le vrai téléphone à la fin du projet.
- Vérification du bloc A par une autre IA : 26 critères réussis sur 26 ; 4 défauts corrigés sans module ajouté : le bouton retour du téléphone ferme le panneau ou l'écran ouvert au lieu de quitter l'appli ; plus de contour orange après un choix ; le message d'erreur de la saisie disparaît dès la correction ; la liste ne défile plus sous l'heure.
- Corrections revérifiées par une autre IA : tout réussi. Bloc A fusionné dans la branche principale avec l'accord de Kinder. Suite : bloc B, à partir d'un vrai export Money Lover.

## 2026-11-03 — Implémentation, bloc A (phase 6)

- Étape 1 (coquille) et étape 2 (porte-monnaie) codées et vérifiées dans l'aperçu ; installation sur téléphone en attente du kit Android.
- Police Manrope intégrée à l'appli (licence libre, pas une dépendance).
- D23 : l'écran Catégories est placé dans l'onglet Comptes.
- D24 : bibliothèque d'icônes Lucide validée (P3 tranché).
- Étapes 3 à 6 codées et vérifiées dans l'aperçu : catégories avec icônes, saisie, liste et accueil, recherche, transferts. 12 tests automatiques réussis.
- Projet Android créé ; fabrication du fichier d'installation en attente du kit Android sur le poste.
- Bloc A complet dans l'aperçu ; point de contrôle sur téléphone à faire.
- Envoyé sur GitHub (branches `main` et `bloc-a`), non fusionné.
- **Reprise sur le PC principal de Kinder**, dans cet ordre : installer le kit Android, fabriquer le fichier d'installation, vérifier le bloc A sur le téléphone, fusionner `bloc-a` avec l'accord de Kinder, puis bloc B (import) à partir d'un vrai export Money Lover.

## 2026-11-03 — Critères de validation (phase 5)

- Dépôt relié à github.com/Kinder2149/Monetico (le nom affiché de l'appli reste Moneta, D1).
- Nouvelle méthode validée par Kinder (D21) : critères proposés par Claude Code et validés d'un bloc, code enchaîné avec un point de contrôle à la fin de chaque bloc.
- Critères des 15 étapes validés par Kinder, propositions comprises (PROJET_CONTEXTE, section 10 ; décision D22).
- Nouveaux points ouverts P7 à P9 (P6 tranché par D22).

## 2026-11-03 — Plan (phase 4)

- Dépôt git local créé ; premier enregistrement limité aux trois fichiers de documentation.
- Plan du produit en 15 étapes validé par Kinder (PROJET_CONTEXTE, section 9 ; décision D20).
- Point ouvert P2 élargi : la place de l'écran Catégories dans la navigation sera aussi tranchée (dès l'étape 3).
- Aucun code écrit. Prochaine phase : 5 — cadrage de l'étape 1 (coquille de l'appli).

## 2026-11-03 — Figeage (phase 3)

- Création de la base documentaire : PROJET_CONTEXTE.md, CHANGELOG.md, CLAUDE.md.
- Vision, périmètre et 19 décisions figées (PROJET_CONTEXTE, section 6) validés par Kinder.
- Charte graphique retenue : piste A « Menthe claire ».
- Nom retenu : Moneta (vérification de disponibilité à faire avant publication).
- Aucun code écrit à ce stade. Prochaine phase : 4 — Plan.
