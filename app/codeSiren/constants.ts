import { NoDataMessage } from "../../lib/cleanData/types";
import { SireneFieldKey, SireneInputKey } from "./types";

export const TITLE =
  "Ajouter des données SIRENE à partir d'un champ existant";

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
];

export const OUTPUT_FIELD_LABELS: Record<SireneFieldKey, string> = {
  nom: "Nom complet",
  siren: "SIREN",
  siret: "SIRET (établissement siège)",
  adresse: "Adresse (siège)",
  code_postal: "Code postal (siège)",
  code_commune: "Code commune Insee (siège)",
  libelle_commune: "Commune (siège)",
  activite_principale: "Activité principale (code NAF/APE)",
  nature_juridique: "Nature juridique",
  date_creation: "Date de création",
};

export const OUTPUT_FIELD_OPTIONS: { key: SireneFieldKey; label: string }[] = (
  Object.keys(OUTPUT_FIELD_LABELS) as SireneFieldKey[]
).map((key) => ({ key, label: OUTPUT_FIELD_LABELS[key] }));

// These fields are not returned by the api when the "minimal" search mode is used.
export const FIELDS_REQUIRING_FULL_DATA: SireneFieldKey[] = [
  "activite_principale",
  "nature_juridique",
  "date_creation",
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
  // Disambiguation columns only make sense for a fuzzy search by name: SIREN/SIRET
  // lookups are exact matches.
  if (inputKey === "nom") {
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
