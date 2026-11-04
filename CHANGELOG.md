# CHANGELOG — Moneta

## 2026-11-04 — Vérification du bloc C, étapes 8 à 13 (phase 6)

- Poste de travail équipé pour fabriquer l'appli : Java 21 (Temurin), kit Android 36, téléphone virtuel `Medium_Phone_API_36.1`. Ce poste n'a que 8 Go de mémoire : le téléphone virtuel y est lent et Android s'est arrêté une fois (pas Moneta).
- Vérification sur le téléphone virtuel, avec le vrai export (1 858 opérations, solde 649,54 € retrouvé) : tous les critères des étapes 8 à 13 réussis, ainsi que les critères généraux (mode avion, données conservées après arrêt complet du téléphone).
- Recoupements : camembert de novembre = 724,13 € = sorties du mois ; octobre = 1 793,50 € = somme des 40 dépenses de la liste.
- D29 : écart de l'étape 12 accepté par Kinder (aucune autorisation demandée par le sélecteur de photos d'Android, critère 1).
- Remarques sans échec : la courbe du solde n'affiche que la valeur du dernier mois ; elle montre un solde négatif de janvier à octobre, à comparer avec Money Lover.
- Étape 14 (sauvegarde Google Drive) non commencée : P5 et P8 à trancher avant.

## 2026-11-03 — Bloc C (phase 6)

- Étape 8 codée : budgets (nom, catégories cochées, maximum, jour de départ), « dépensé / maximum » avec barre, rouge en cas de dépassement, exclusion d'une dépense, carte sur l'accueil. Cocher une catégorie inclut ses sous-catégories.
- Étape 9 codée : récurrentes mensuelles, carte « À valider » sur l'accueil, validation avec la date réelle ; écran des récurrentes placé dans l'onglet Comptes (comme Catégories, D23). Supprimer l'opération validée remet le mois « À valider ».
- 6 tests ajoutés (23 au total). Vérification par une autre IA prévue à la fin du bloc C (D25).
- D27 : place des écrans Prêts, Graphiques et Réglages validée par Kinder (P2 tranché).
- D28 : effet des prêts et remboursements sur le solde validé par Kinder (P7 tranché).
- Étape 10 codée : prêts (personne, montant, date, porte-monnaie), remboursements, reste dû, « Remboursé » ; total « On me doit ».
- Étape 11 codée : camembert des dépenses du mois (les 6 plus grosses catégories, le reste regroupé), changement de mois, courbe du solde total en fin de mois sur 12 mois ; dessinés dans l'appli, sans module ajouté.
- Étape 12 codée : photo de la galerie comme icône de catégorie, recadrée et réduite ; choix par le sélecteur de photos d'Android, qui ne demande pas d'autorisation (écart avec le critère 1, qui en prévoyait une).
- Étape 13 codée : écran Réglages (roue dentée de l'onglet Comptes) avec l'import Money Lover, déplacé depuis Comptes, et la version de l'appli. La sauvegarde y sera ajoutée à l'étape 14.

## 2026-11-03 — Bloc B, import Money Lover (phases 5 et 6)

- Export réel analysé : 1 866 opérations, un compte, 49 catégories, 8 opérations à venir. P4 tranché.
- D26 : règles de l'import validées par Kinder (emplacement, catégories, opérations à venir, événement, doublons, solde de contrôle 649,54 €).
- Étape 7 codée : bouton dans Comptes, résumé d'import, import en une seule fois (tout ou rien), 5 tests ajoutés (17 au total).
- Vérifiée par une autre IA sur le téléphone virtuel avec le vrai export : tous les critères réussis. Corrigé : espace des milliers dans le résumé (« 1 858 »).
- Bloc B fusionné dans la branche principale avec l'accord de Kinder. Suite : bloc C, étape 8 (budgets).

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
