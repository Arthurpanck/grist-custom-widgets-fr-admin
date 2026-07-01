export type SireneInputKey = "nom" | "siren" | "siret";

export type SireneFieldKey =
  | "nom"
  | "siren"
  | "siret"
  | "adresse"
  | "code_postal"
  | "code_commune"
  | "libelle_commune"
  | "activite_principale"
  | "nature_juridique"
  | "date_creation";

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
};

export type RawSireneResult = {
  siren: string;
  nom_complet: string;
  activite_principale?: string;
  nature_juridique?: string;
  date_creation?: string;
  siege: RawSireneSiege;
  score: number;
};

export type NormalizedSireneResult = {
  label: string;
  siret: string | undefined;
  score: number;
} & Partial<Record<SireneFieldKey, string>>;
