import { NoDataMessage } from "../../lib/cleanData/types";
import { SireneFieldKey, SireneInputKey } from "./types";

export const TITLE = "Ajouter des données SIRENE à partir d'un champ existant";

// Key used to persist the input/output fields chosen by the user as widget options.
export const WIDGET_OPTIONS_KEY = "sireneFieldsConfig";

export const SOURCE_COLUMN_NAME = "source";
export const DEPARTEMENT_COLUMN_NAME = "departement";
export const CODE_COMMUNE_COLUMN_NAME = "code_commune";
export const CODE_POSTAL_COLUMN_NAME = "code_postal";

export const INPUT_FIELD_OPTIONS: {
  key: SireneInputKey;
  label: string;
}[] = [
  { key: "nom", label: "Nom (raison sociale)" },
  { key: "siren", label: "SIREN" },
  { key: "siret", label: "SIRET" },
  { key: "adresse", label: "Adresse" },
];

// Nom et adresse sont des recherches floues (texte libre), contrairement au SIREN/SIRET
// qui sont des identifiants recherchés en correspondance exacte par l'api.
export const FUZZY_SEARCH_INPUT_KEYS: SireneInputKey[] = ["nom", "adresse"];

// Champs regroupés par objet de la réponse de l'api (voir search-api,
// app/models/unite_legale.py) : unité légale (toujours renvoyée), établissement siège
// (nécessite include=siege) et compléments (nécessite include=complements).
export const OUTPUT_FIELD_GROUPS: {
  label: string;
  keys: SireneFieldKey[];
}[] = [
  {
    label: "Unité légale",
    keys: [
      "nom",
      "nom_raison_sociale",
      "sigle",
      "siren",
      "categorie_entreprise",
      "tranche_effectif_salarie",
      "nature_juridique",
      "etat_administratif",
      "activite_principale",
      "section_activite_principale",
      "date_creation",
      "date_fermeture",
      "nombre_etablissements",
      "nombre_etablissements_ouverts",
    ],
  },
  {
    label: "Établissement siège",
    keys: [
      "siret",
      "adresse",
      "code_postal",
      "code_commune",
      "libelle_commune",
      "departement",
      "region",
      "epci",
    ],
  },
  {
    label: "Compléments",
    keys: ["est_association", "est_ess"],
  },
];

export const OUTPUT_FIELD_LABELS: Record<SireneFieldKey, string> = {
  nom: "Nom complet",
  nom_raison_sociale: "Nom / raison sociale",
  sigle: "Sigle",
  siren: "SIREN",
  categorie_entreprise: "Catégorie d'entreprise (PME, ETI, GE...)",
  tranche_effectif_salarie: "Tranche d'effectif salarié",
  nature_juridique: "Nature juridique",
  etat_administratif: "État administratif (actif/cessé)",
  activite_principale: "Activité principale (code NAF/APE)",
  section_activite_principale: "Section d'activité principale (NAF)",
  date_creation: "Date de création",
  date_fermeture: "Date de fermeture",
  nombre_etablissements: "Nombre d'établissements",
  nombre_etablissements_ouverts: "Nombre d'établissements ouverts",
  siret: "SIRET (établissement siège)",
  adresse: "Adresse (siège)",
  code_postal: "Code postal (siège)",
  code_commune: "Code commune Insee (siège)",
  libelle_commune: "Commune (siège)",
  departement: "Département (siège)",
  region: "Région (siège)",
  epci: "EPCI (siège)",
  est_association: "Est une association",
  est_ess: "Fait partie de l'économie sociale et solidaire (ESS)",
};

export const OUTPUT_FIELD_OPTIONS: { key: SireneFieldKey; label: string }[] =
  OUTPUT_FIELD_GROUPS.flatMap((group) => group.keys).map((key) => ({
    key,
    label: OUTPUT_FIELD_LABELS[key],
  }));

// The api only returns the "complements" object if explicitly requested through the "include"
// query param (see the recherche-entreprises search-api source code, app/utils/helpers.py). We
// always request "siege" (needed to identify a result by its SIRET), so it's requested
// unconditionally in callSireneApi.
export const FIELDS_REQUIRING_COMPLEMENTS_INCLUDE: SireneFieldKey[] = [
  "est_association",
  "est_ess",
];

export const buildColumnMappingNames = (
  inputKey: SireneInputKey,
  outputKeys: SireneFieldKey[],
) => {
  const inputOption = INPUT_FIELD_OPTIONS.find(
    (option) => option.key === inputKey,
  )!;
  const columns: {
    name: string;
    title: string;
    type: string;
    optional: boolean;
  }[] = [
    {
      name: SOURCE_COLUMN_NAME,
      title: `${inputOption.label} (source)`,
      type: "Any",
      optional: false,
    },
  ];
  // Disambiguation columns only make sense for a fuzzy search (nom/adresse): SIREN/SIRET
  // lookups are exact matches.
  if (FUZZY_SEARCH_INPUT_KEYS.includes(inputKey)) {
    columns.push(
      {
        name: DEPARTEMENT_COLUMN_NAME,
        title: "Code Insee du département (désambiguïsation)",
        type: "Any",
        optional: true,
      },
      {
        name: CODE_COMMUNE_COLUMN_NAME,
        title: "Code Insee de la commune (désambiguïsation)",
        type: "Any",
        optional: true,
      },
      {
        name: CODE_POSTAL_COLUMN_NAME,
        title: "Code postal de la commune (désambiguïsation)",
        type: "Any",
        optional: true,
      },
    );
  }
  outputKeys.forEach((key) => {
    columns.push({
      name: key,
      title: `${OUTPUT_FIELD_LABELS[key]} (destination)`,
      type: "Any",
      optional: false,
    });
  });
  return columns;
};

export const NO_DATA_MESSAGES: NoDataMessage = {
  NO_DESTINATION_DATA:
    "Il n’existe pas de donnée dans les résultats pour la valeur source sélectionnée.",
  NO_RESULT:
    "Aucun résultat ne correspond à la valeur source sélectionnée. Veuillez vérifier si cette valeur existe bien ou qu’il n’y a pas d’erreur.",
  NO_SOURCE_DATA:
    "Afin de traiter la ligne sélectionnée, veuillez renseigner le champ source.",
  API_ERROR:
    "Une erreur est survenue lors de l'appel à l'api, veuillez appeler le service technique.",
};
