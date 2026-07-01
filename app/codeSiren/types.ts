export type SireneInputKey = "nom" | "siren" | "siret" | "adresse";

export type SireneFieldKey =
  // Champs "unité légale" (toujours renvoyés par l'api, quel que soit "include")
  | "nom"
  | "nom_raison_sociale"
  | "sigle"
  | "siren"
  | "categorie_entreprise"
  | "tranche_effectif_salarie"
  | "nature_juridique"
  | "etat_administratif"
  | "activite_principale"
  | "section_activite_principale"
  | "date_creation"
  | "date_fermeture"
  | "nombre_etablissements"
  | "nombre_etablissements_ouverts"
  // Champs de l'établissement siège (nécessitent include=siege)
  | "siret"
  | "adresse"
  | "code_postal"
  | "code_commune"
  | "libelle_commune"
  | "departement"
  | "region"
  | "epci"
  // Champs complémentaires (nécessitent include=complements)
  | "est_association"
  | "est_ess";

export type SireneFieldsConfig = {
  input: SireneInputKey;
  outputs: SireneFieldKey[];
};

export type RawSireneSiege = {
  siret: string;
  adresse?: string;
  code_postal?: string;
  commune?: string;
  libelle_commune?: string;
  departement?: string;
  region?: string;
  epci?: string;
};

export type RawSireneComplements = {
  est_association?: boolean;
  est_ess?: boolean;
};

export type RawSireneResult = {
  siren: string;
  nom_complet: string;
  nom_raison_sociale?: string;
  sigle?: string;
  categorie_entreprise?: string;
  tranche_effectif_salarie?: string;
  nature_juridique?: string;
  etat_administratif?: string;
  activite_principale?: string;
  section_activite_principale?: string;
  date_creation?: string;
  date_fermeture?: string;
  nombre_etablissements?: number;
  nombre_etablissements_ouverts?: number;
  siege?: RawSireneSiege;
  complements?: RawSireneComplements;
  score: number;
};

export type NormalizedSireneResult = {
  label: string;
  siret: string | undefined;
  score: number;
} & Partial<Record<SireneFieldKey, string>>;
