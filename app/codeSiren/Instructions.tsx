"use client";

import { Accordion } from "../../components/Accordion";

export const Instructions = () => {
  const instructions = (
    <>
      Cette Vue permet de compléter des informations SIRENE (SIREN, SIRET, nom,
      adresse...) à partir d'un champ que vous possédez déjà.
      <br />
      Fonctionnement :
      <ul>
        <li>
          Choisissez d'abord le champ source que vous possédez (Nom, SIREN ou
          SIRET) ainsi que les informations que vous souhaitez récupérer. Cette
          configuration peut être modifiée à tout moment via le bouton "Modifier
          les champs source/destination".
        </li>
        <li>
          Indiquer ensuite dans les options du widget la colonne source ainsi
          que les colonnes à remplir pour chaque information choisie (colonne de
          type Texte). Si le champ source est le nom, il est possible d'indiquer
          d'autres colonnes pour aider à désambiguer.
        </li>
        <li>
          Vérifiez que vous avez bien créer un lien entre la vue et la table :
          dans Données Source &gt; Sélectionner par : choisir la table qui
          contient vos entités pour lesquelles il faut définir les informations
          SIRENE.
        </li>
        <li>
          Faire une recherche globale afin de faire une première passe sur
          toutes vos lignes.
        </li>
        <li>
          Désambiguer ligne par ligne. La raison de pourquoi la Vue n'a pas
          réussi à remplir les informations automatiquement vous sera indiquée.
          Attention: si la ligne selectionnée reste bloquée sur la première de
          votre table c'est que le lien entre la Vue et la table est manquant.
          Vous devez indiquer dans les données sources de la Vue le
          "Selectionner par".
        </li>
        <li>
          Une fois le nettoyage de la donnée effectuée vous pouvez supprimer
          cette vue.
        </li>
      </ul>
    </>
  );

  return <Accordion label="Afficher les instructions" body={instructions} />;
};
