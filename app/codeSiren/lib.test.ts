import fetchMock from "jest-fetch-mock";
import {
  areTooCloseResults,
  callSireneApi,
  getSireneResults,
  isDoubtfulResults,
  mappingsIsReady,
} from "./lib";
import { NO_DATA_MESSAGES } from "./constants";

fetchMock.enableMocks();
fetchMock.dontMock();

const mappings = {
  source: "source",
  departement: "departement",
  code_commune: "code_commune",
  code_postal: "code_postal",
  siren: "siren",
  siret: "siret",
  nom: "nom",
  adresse: "adresse",
  est_association: "est_association",
};

const apiResult = {
  siren: "123456789",
  nom_complet: "ACME SAS",
  nom_raison_sociale: "ACME",
  sigle: "ACM",
  categorie_entreprise: "PME",
  tranche_effectif_salarie: "12",
  nature_juridique: "5710",
  etat_administratif: "A",
  activite_principale: "62.01Z",
  section_activite_principale: "J",
  date_creation: "2010-01-01",
  nombre_etablissements: 3,
  nombre_etablissements_ouverts: 2,
  score: 1,
  siege: {
    siret: "12345678900012",
    adresse: "1 RUE DE LA PAIX 75002 PARIS",
    code_postal: "75002",
    commune: "75102",
    libelle_commune: "PARIS",
    departement: "75",
    region: "11",
    epci: "200054781",
  },
  complements: {
    est_association: false,
    est_ess: true,
  },
};

describe("callSireneApi", () => {
  beforeEach(() => {
    fetchMock.doMock();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.resetMocks();
    fetchMock.dontMock();
  });

  it("should always call the api with minimal=true and request score+siege", async () => {
    fetchMock.mockResponse(JSON.stringify({ results: [] }));
    await callSireneApi("acme", ["siren", "siret", "nom"]);
    const calledUrl = new URL(fetchMock.mock.lastCall![0] as string);
    expect(calledUrl.searchParams.get("minimal")).toBe("true");
    expect(calledUrl.searchParams.get("q")).toBe("acme");
    expect(calledUrl.searchParams.get("include")).toBe("score,siege");
    expect(calledUrl.searchParams.has("est_collectivite_territoriale")).toBe(
      false,
    );
  });

  it("should add complements to include when a complements field is requested", async () => {
    fetchMock.mockResponse(JSON.stringify({ results: [] }));
    await callSireneApi("acme", ["est_association"]);
    const calledUrl = new URL(fetchMock.mock.lastCall![0] as string);
    expect(calledUrl.searchParams.get("include")).toBe(
      "score,siege,complements",
    );
  });

  it("should forward disambiguation params and collectivite filter when provided", async () => {
    fetchMock.mockResponse(JSON.stringify({ results: [] }));
    await callSireneApi("acme", ["siren"], true, "75", "75102", "75002");
    const calledUrl = new URL(fetchMock.mock.lastCall![0] as string);
    expect(calledUrl.searchParams.get("est_collectivite_territoriale")).toBe(
      "true",
    );
    expect(calledUrl.searchParams.get("departement")).toBe("75");
    expect(calledUrl.searchParams.get("code_commune")).toBe("75102");
    expect(calledUrl.searchParams.get("code_postal")).toBe("75002");
  });

  it("should normalize the api results with all the known field extractors", async () => {
    fetchMock.mockResponse(JSON.stringify({ results: [apiResult] }));
    const results = await callSireneApi("acme", ["siren"]);
    expect(results).toStrictEqual([
      {
        label: "ACME SAS",
        siret: "12345678900012",
        score: 1,
        nom: "ACME SAS",
        nom_raison_sociale: "ACME",
        sigle: "ACM",
        siren: "123456789",
        categorie_entreprise: "PME",
        tranche_effectif_salarie: "12",
        nature_juridique: "5710",
        etat_administratif: "A",
        activite_principale: "62.01Z",
        section_activite_principale: "J",
        date_creation: "2010-01-01",
        date_fermeture: undefined,
        nombre_etablissements: "3",
        nombre_etablissements_ouverts: "2",
        adresse: "1 RUE DE LA PAIX 75002 PARIS",
        code_postal: "75002",
        code_commune: "75102",
        libelle_commune: "PARIS",
        departement: "75",
        region: "11",
        epci: "200054781",
        est_association: "false",
        est_ess: "true",
      },
    ]);
  });
});

describe("getSireneResults", () => {
  beforeEach(() => {
    fetchMock.doMock();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.resetMocks();
    fetchMock.dontMock();
  });

  it("should return a NO_SOURCE_DATA message when the source field is empty", async () => {
    const record = { id: 1, source: "", siren: "", siret: "" };
    const results = await getSireneResults(
      record,
      mappings,
      false,
      false,
      "nom",
      ["siren", "siret"],
    );
    expect(results).toStrictEqual({
      recordId: 1,
      sourceData: "",
      results: [],
      noResultMessage: NO_DATA_MESSAGES.NO_SOURCE_DATA,
      toIgnore: false,
    });
  });

  it("should ignore the record when destinations are already filled and checkDestinationIsEmpty is true", async () => {
    const record = { id: 2, source: "acme", siren: "123456789", siret: "" };
    const results = await getSireneResults(
      record,
      mappings,
      true,
      false,
      "nom",
      ["siren"],
    );
    expect(results).toStrictEqual({
      recordId: 2,
      sourceData: "",
      results: [],
      noResultMessage: undefined,
      toIgnore: true,
    });
  });

  it("should call the api when at least one selected destination is empty", async () => {
    fetchMock.mockResponse(JSON.stringify({ results: [apiResult] }));
    const record = {
      id: 3,
      source: "acme",
      siren: "123456789",
      siret: "",
    };
    const results = await getSireneResults(
      record,
      mappings,
      true,
      false,
      "nom",
      ["siren", "siret"],
    );
    expect(results.toIgnore).toBe(false);
    expect(results.results).toHaveLength(1);
  });

  it("should not send disambiguation params nor collectivite filter when the input field is siret", async () => {
    fetchMock.mockResponse(JSON.stringify({ results: [apiResult] }));
    const record = {
      id: 4,
      source: "12345678900012",
      siren: "",
      departement: "75",
    };
    await getSireneResults(record, mappings, false, true, "siret", ["siren"]);
    const calledUrl = new URL(fetchMock.mock.lastCall![0] as string);
    expect(calledUrl.searchParams.has("departement")).toBe(false);
    expect(calledUrl.searchParams.has("est_collectivite_territoriale")).toBe(
      false,
    );
  });

  it("should send disambiguation params and collectivite filter when the input field is adresse", async () => {
    fetchMock.mockResponse(JSON.stringify({ results: [apiResult] }));
    const record = {
      id: 6,
      source: "1 rue de la paix",
      siren: "",
      departement: "75",
    };
    await getSireneResults(record, mappings, false, true, "adresse", ["siren"]);
    const calledUrl = new URL(fetchMock.mock.lastCall![0] as string);
    expect(calledUrl.searchParams.get("departement")).toBe("75");
    expect(calledUrl.searchParams.get("est_collectivite_territoriale")).toBe(
      "true",
    );
  });

  it("should return a NO_RESULT message when the api returns no result", async () => {
    fetchMock.mockResponse(JSON.stringify({ results: [] }));
    const record = { id: 5, source: "zzzzzzzzz", siren: "" };
    const results = await getSireneResults(
      record,
      mappings,
      false,
      false,
      "nom",
      ["siren"],
    );
    expect(results.noResultMessage).toBe(NO_DATA_MESSAGES.NO_RESULT);
  });
});

describe("isDoubtfulResults / areTooCloseResults", () => {
  it("isDoubtfulResults always returns false", () => {
    expect(isDoubtfulResults([])).toBe(false);
  });

  it("areTooCloseResults returns true when the two best scores are close", () => {
    expect(
      areTooCloseResults([
        { label: "a", siret: "1", score: 1 },
        { label: "b", siret: "2", score: 0.9 },
      ]),
    ).toBe(true);
  });

  it("areTooCloseResults returns false when there is a single result", () => {
    expect(areTooCloseResults([{ label: "a", siret: "1", score: 1 }])).toBe(
      false,
    );
  });
});

describe("mappingsIsReady", () => {
  it("returns false when the source column is not mapped", () => {
    expect(mappingsIsReady({ siren: "siren" }, ["siren"])).toBeFalsy();
  });

  it("returns false when no output is selected", () => {
    expect(mappingsIsReady({ source: "source" }, [])).toBeFalsy();
  });

  it("returns false when one of the selected outputs is not mapped", () => {
    expect(
      mappingsIsReady({ source: "source", siren: "siren" }, ["siren", "siret"]),
    ).toBeFalsy();
  });

  it("returns true when source and all outputs are mapped", () => {
    expect(
      mappingsIsReady({ source: "source", siren: "siren", siret: "siret" }, [
        "siren",
        "siret",
      ]),
    ).toBeTruthy();
  });
});
