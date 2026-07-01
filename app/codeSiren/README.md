# Code SIREN

Ce widget permet de compléter de la donnée existante en récupérant des informations SIRENE (SIREN, SIRET, nom, adresse, code postal, commune, activité principale, nature juridique, date de création) à partir d'un champ que vous possédez déjà (nom, SIREN ou SIRET).

API utilisée : https://recherche-entreprises.api.gouv.fr

Le widget est configurable : lors de la première utilisation (ou via le bouton « Modifier les champs source/destination »), l'utilisateur choisit :
- le champ source qu'il possède déjà : Nom (raison sociale), SIREN ou SIRET ;
- les informations qu'il souhaite récupérer parmi celles listées ci-dessus.

Cette configuration détermine ensuite les colonnes proposées dans la fenêtre de mapping des colonnes du widget (une colonne source, et une colonne destination par information choisie).

Pour chaque ligne le widget interroge l'API afin de trouver les informations correspondantes. Lorsque le champ source est le SIREN ou le SIRET, la recherche est une correspondance exacte. Lorsque le champ source est le nom, la recherche est une recherche floue et peut renvoyer plusieurs résultats ; il est alors possible d'indiquer des colonnes supplémentaires (département, code commune, code postal) pour aider à désambiguer.

Il est possible que l'API ne trouve aucun résultat ou en trouve plusieurs. Pour le moment l'API ne retourne pas de score de fiabilité et retourne presque toujours plusieurs résultats. Le premier résultat retourné est celui pris en compte.

Le `ChoiceBanner` permettant à l'utilisateur de choisir parmis les choix proposés par l'API en cas d'ambiguité n'est donc dans les faits jamais utilisés pour le moment. Si nous proposons à l'utilisateur de désambiguer à chaque fois ça pourrait être très laborieux puisqu'il faudrait le faire pour toutes les lignes. \
&rarr; C'est un point à améliorer, potentiellement en contribuant à l'API.

L'utilisateur peut effectuer une recherche globale (l'API sera appelée pour chaque ligne, l'une après l'autre si aucun résultat n'existe déjà) ou une recherche spécifique pour la ligne sélectionnée.

Une fois le travail de renseigement et nettoyage terminé ce widget est voué à être supprimé.
