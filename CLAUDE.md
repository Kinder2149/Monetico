# CLAUDE.md — Moneta

À lire avant toute action : `PROJET_CONTEXTE.md` (référence du projet, décisions figées en section 6)
et `CHANGELOG.md` (historique).

## Règles du projet

- Tout en français. Termes fonctionnels avec Kinder, jamais de jargon technique.
- Kinder est product owner : il ne lit pas le code ; il valide par capture d'écran.
- Toujours dire dans quelle phase on se trouve (1 à 6). Aucune phase ne se saute.
- Une étape à la fois. Pas de code sans critère de validation écrit par Kinder (phase 5).
- Résultats de test rendus en langage fonctionnel : quel critère, réussi ou échoué.
- Aucune dépendance ajoutée sans l'accord de Kinder (seule validée : accès à la galerie photo).
- Ne jamais toucher à Vault Watch ni à aucun autre projet.
- Une option recommandée avec justification, une question à la fois.
- Challenge au format : « ⚠️ [le problème en une phrase] — je continue ou on ajuste ? »
- Toute nouvelle décision validée est ajoutée en section 6 du PROJET_CONTEXTE et notée au CHANGELOG.
- Maximum 5 fichiers de documentation, 20 modules, 3 couches. Zéro structure vide « pour le futur ».

## Hygiène git (règle uniforme, tous appareils)

**Début de mission, avant tout travail**
1. S'il y a du travail non enregistré : s'arrêter, montrer à Kinder quels fichiers et depuis quand, et le laisser choisir (enregistrer, mettre de côté ou abandonner). Ne jamais le jeter soi-même.
2. Récupérer l'état du dépôt en ligne.
3. Si la copie est simplement en retard : la mettre à jour. Si la copie et le dépôt en ligne ont chacun du nouveau (divergence) : s'arrêter, expliquer, ne rien mélanger.

**Pendant la mission**
4. Travailler sur une branche à part, jamais directement sur la branche principale.
5. Ne fusionner dans la branche principale qu'après l'accord explicite de Kinder dans la conversation.

**Fin de mission**
6. Après fusion : supprimer la branche (copie locale, et copie en ligne si elle existe encore). Ne jamais toucher à une branche dont le nom commence par `archive/` : c'est de l'archivage.
7. Si la suppression en ligne est impossible depuis cet appareil : donner à Kinder la commande exacte à lancer, sans réessayer en boucle.
8. Ne jamais supprimer une branche non fusionnée sans décision de Kinder, branche par branche.
