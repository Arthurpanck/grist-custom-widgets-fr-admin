import { RowRecord } from "grist/GristData";
import {
  CODE_COMMUNE_COLUMN_NAME,
  CODE_POSTAL_COLUMN_NAME,
  DEPARTEMENT_COLUMN_NAME,
  FIELDS_REQUIRING_COMPLEMENTS_INCLUDE,
  FUZZY_SEARCH_INPUT_KEYS,
  NO_DATA_MESSAGES,
  SOURCE_COLUMN_NAME,
} from "./constants";

import { WidgetColumnMap } from "grist/CustomSectionAPI";
import {
  NormalizedSireneResult,
  RawSireneResult,
  SireneFieldKey,
  SireneInputKey,
} from "./types";
import { MappedRecord } from "../../lib/util/types";
import { UncleanedRecord } from "../../lib/cleanData/types";

const asString = (value: string | number | boolean | undefined) =>
  value === undefined ? undefined : String(value);

const FIELD_EXTRACTORS: Record<
  SireneFieldKey,
  (result: RawSireneResult) => string | undefined
> = {
  nom: (result) => result.nom_complet,
  nom_raison_sociale: (result) => result.nom_raison_sociale,
  sigle: (result) => result.sigle,
  siren: (result) => result.siren,
  categorie_entreprise: (result) => result.categorie_entreprise,
  tranche_effectif_salarie: (result) => result.tranche_effectif_salarie,
  nature_juridique: (result) => result.nature_juridique,
  etat_administratif: (result) => result.etat_administratif,
  activite_principale: (result) => result.activite_principale,
  section_activite_principale: (result) => result.section_activite_principale,
  date_creation: (result) => result.date_creation,
  date_fermeture: (result) => result.date_fermeture,
  nombre_etablissements: (result) => asString(result.nombre_etablissements),
  nombre_etablissements_ouverts: (result) =>
    asString(result.nombre_etablissements_ouverts),
  siret: (result) => result.siege?.siret,
  adresse: (result) => result.siege?.adresse,
  code_postal: (result) => result.siege?.code_postal,
  code_commune: (result) => result.siege?.commune,
  libelle_commune: (result) => result.siege?.libelle_commune,
  departement: (result) => result.siege?.departement,
  region: (result) => result.siege?.region,
  epci: (result) => result.siege?.epci,
  est_association: (result) => asString(result.complements?.est_association),
  est_ess: (result) => asString(result.complements?.est_ess),
};

const buildNormalizedResult = (
  result: RawSireneResult,
): NormalizedSireneResult => {
  const normalized: NormalizedSireneResult = {
    label: result.nom_complet,
    siret: result.siege?.siret,
    score: result.score,
  };
  (Object.keys(FIELD_EXTRACTORS) as SireneFieldKey[]).forEach((key) => {
    normalized[key] = FIELD_EXTRACTORS[key](result);
  });
  return normalized;
};

export const callSireneApi = async (
  query: string,
  outputKeys: SireneFieldKey[],
  isCollectiviteTerritoriale?: boolean,
  dept?: string,
  codeCommune?: string,
  codePostal?: string,
): Promise<NormalizedSireneResult[]> => {
  const url = new URL("https://recherche-entreprises.api.gouv.fr/search");
  url.searchParams.set("q", query);
  // TODO : check constrainte of shape : code commune strings of lenght 5, dept strings of lenght 2 or 3
  // "unité légale" fields (siren, nom_complet, activite_principale...) are always returned by the
  // api. "siege" and "complements" are nested objects only returned when explicitly requested
  // through "include" (with minimal=true) : see the recherche-entreprises search-api source, in
  // app/utils/helpers.py (create_fields_to_include). We always request "siege" (needed to
  // identify a result by its SIRET) and add "complements" only when needed.
  const include = new Set(["score", "siege"]);
  if (
    outputKeys.some((key) => FIELDS_REQUIRING_COMPLEMENTS_INCLUDE.includes(key))
  ) {
    include.add("complements");
  }
  url.searchParams.set("minimal", "true");
  url.searchParams.set("include", Array.from(include).join(","));
  if (isCollectiviteTerritoriale !== undefined) {
    url.searchParams.set(
      "est_collectivite_territoriale",
      isCollectiviteTerritoriale.toString(),
    );
  }
  if (dept) {
    url.searchParams.set("departement", dept);
  }
  if (codeCommune) {
    url.searchParams.set("code_commune", codeCommune);
  }
  if (codePostal) {
    url.searchParams.set("code_postal", codePostal);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(
      "The call to the recherche-entreprises.api.gouv.fr api is not 200 status",
      response,
    );
  }
  const data = await response.json();
  // @ts-expect-error result in any type
  return (data.results ?? []).slice(0, 5).map((result) => {
    return buildNormalizedResult(result);
  });
};

export const getSireneResults = async (
  mappedRecord: MappedRecord,
  mappings: WidgetColumnMap,
  checkDestinationIsEmpty: boolean,
  isCollectiviteTerritoriale: boolean,
  inputKey: SireneInputKey,
  outputKeys: SireneFieldKey[],
): Promise<UncleanedRecord<NormalizedSireneResult>> => {
  let noResultMessage;
  let query = "";
  let sireneResults: NormalizedSireneResult[] = [];
  let toIgnore = false;
  if (mappedRecord[SOURCE_COLUMN_NAME]) {
    // Call the api if we don't have to check the destination columns or if at least one is empty
    if (
      !checkDestinationIsEmpty ||
      outputKeys.some((key) => !mappedRecord[key])
    ) {
      query = mappedRecord[SOURCE_COLUMN_NAME];
      const isFuzzySearch = FUZZY_SEARCH_INPUT_KEYS.includes(inputKey);
      const departement = isFuzzySearch
        ? mappedRecord[DEPARTEMENT_COLUMN_NAME]
        : undefined;
      const codeCommune = isFuzzySearch
        ? mappedRecord[CODE_COMMUNE_COLUMN_NAME]
        : undefined;
      const codePostal = isFuzzySearch
        ? mappedRecord[CODE_POSTAL_COLUMN_NAME]
        : undefined;
      sireneResults = await callSireneApi(
        query,
        outputKeys,
        // Filtering by collectivité territoriale only makes sense for a fuzzy search (nom/adresse),
        // an exact SIREN/SIRET match should never be filtered out.
        isFuzzySearch ? isCollectiviteTerritoriale : undefined,
        departement,
        codeCommune,
        codePostal,
      );
      if (sireneResults === undefined) {
        console.error(
          "The call to the api give a response with undefined result",
        );
        noResultMessage = NO_DATA_MESSAGES.API_ERROR;
      } else if (sireneResults.length === 0) {
        noResultMessage = NO_DATA_MESSAGES.NO_RESULT;
      }
    } else {
      toIgnore = true;
    }
  } else {
    noResultMessage = NO_DATA_MESSAGES.NO_SOURCE_DATA;
  }
  return {
    recordId: mappedRecord.id,
    sourceData: query,
    results: sireneResults,
    noResultMessage,
    toIgnore,
  };
};

export const getSireneResultsForRecord = async (
  record: RowRecord,
  mappings: WidgetColumnMap,
  isCollectiviteTerritoriale: boolean,
  inputKey: SireneInputKey,
  outputKeys: SireneFieldKey[],
) => {
  return await getSireneResults(
    grist.mapColumnNames(record),
    mappings,
    false,
    isCollectiviteTerritoriale,
    inputKey,
    outputKeys,
  );
};

export const getSireneResultsForRecords = async (
  records: RowRecord[],
  mappings: WidgetColumnMap,
  callBackFunction: (
    data: UncleanedRecord<NormalizedSireneResult>[],
    i: number,
    length: number,
  ) => void,
  areCollectivitesTerritoriales: boolean,
  inputKey: SireneInputKey,
  outputKeys: SireneFieldKey[],
) => {
  const sireneDataFromApi: UncleanedRecord<NormalizedSireneResult>[] = [];
  for (const i in records) {
    const record = records[i];
    // We call the API only if the source column is filled and if the destination column are not
    sireneDataFromApi.push(
      await getSireneResults(
        grist.mapColumnNames(record),
        mappings,
        true,
        areCollectivitesTerritoriales,
        inputKey,
        outputKeys,
      ),
    );
    if (parseInt(i) % 10 === 0 || parseInt(i) === records.length - 1) {
      callBackFunction(sireneDataFromApi, parseInt(i), records.length);
      // clear data
      sireneDataFromApi.length = 0;
    }
  }
};

/**
 * Réponse à la question de l'utilisation du score de l'API par un responsable de celle-ci :
 *
 * Il est important de noter que ce score n'est pas une mesure de fiabilité au sens strict du terme.
 * Il est généré par Elasticsearch en fonction de notre algorithme de recherche, utilisé pour classer les résultats.
 * Ce score n'est pas standardisé et peut varier considérablement d'un résultat à l'autre.
 * Il est donc recommandé de l'utiliser avec prudence.
 */
export const isDoubtfulResults = (_: NormalizedSireneResult[]) => {
  return false;
};

export const areTooCloseResults = (dataFromApi: NormalizedSireneResult[]) => {
  if (dataFromApi.length > 1) {
    const [firstChoice, secondChoice] = dataFromApi;
    const ratio = secondChoice.score / firstChoice.score;
    return ratio > 0.8;
  }
  return false;
};

export const mappingsIsReady = (
  mappings: WidgetColumnMap | null,
  outputKeys: SireneFieldKey[],
) => {
  return (
    mappings &&
    mappings[SOURCE_COLUMN_NAME] &&
    outputKeys.length > 0 &&
    outputKeys.every((key) => mappings[key])
  );
};
