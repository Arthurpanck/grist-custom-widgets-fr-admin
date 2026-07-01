"use client";

import { useEffect, useState } from "react";
import { useGristEffect } from "../../lib/grist/hooks";
import { addObjectInRecord, gristReady } from "../../lib/grist/plugin-api";
import {
  buildColumnMappingNames,
  NO_DATA_MESSAGES,
  TITLE,
  WIDGET_OPTIONS_KEY,
} from "./constants";
import {
  areTooCloseResults,
  getSireneResultsForRecord,
  getSireneResultsForRecords,
  isDoubtfulResults,
  mappingsIsReady,
} from "./lib";
import { RowRecord } from "grist/GristData";
import { Title } from "../../components/Title";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { Configuration } from "../../components/Configuration";
import Image from "next/image";
import globalSvg from "../../public/global-processing.svg";
import specificSvg from "../../public/specific-processing.svg";
import { Instructions } from "./Instructions";
import { SpecificProcessing } from "./SpecificProcessing";
import { NormalizedSireneResult, SireneFieldsConfig } from "./types";
import {
  CleanRecord,
  DirtyRecord,
  NoResultRecord,
  UncleanedRecord,
  WidgetCleanDataSteps,
} from "../../lib/cleanData/types";
import { CheckboxParams } from "../../components/CheckboxParams";
import { cleanAndSortRecords } from "../../lib/cleanData/utils";
import GenericGlobalProcessing from "../../components/cleanData/GenericGlobalProcessing";
import { MyFooter } from "./Footer";
import { FieldsConfiguration } from "./FieldsConfiguration";
import "./page.css";

type SireneStep = WidgetCleanDataSteps | "fields_config";

const isValidFieldsConfig = (value: unknown): value is SireneFieldsConfig => {
  const config = value as SireneFieldsConfig | null | undefined;
  return !!config && !!config.input && Array.isArray(config.outputs);
};

const Sirene = () => {
  const [record, setRecord] = useState<RowRecord | null>();
  const [records, setRecords] = useState<RowRecord[]>([]);
  const [dirtyData, setDirtyData] = useState<{
    [recordId: number]: DirtyRecord<NormalizedSireneResult>;
  }>({});
  const [noResultData, setNoResultData] = useState<{
    [recordId: number]: NoResultRecord<NormalizedSireneResult>;
  }>({});
  const [mappings, setMappings] = useState<WidgetColumnMap | null>(null);
  const [globalInProgress, setGlobalInProgress] = useState(false);
  const [atOnProgress, setAtOnProgress] = useState<[number, number]>([0, 0]);
  const [currentStep, setCurrentStep] = useState<SireneStep>("loading");
  const [areCollectivitesTerritoriales, setAreCollectivitesTerritoriales] =
    useState<boolean>(false);
  const [fieldsConfig, setFieldsConfig] = useState<SireneFieldsConfig | null>(
    null,
  );

  useGristEffect(() => {
    grist.ready({ requiredAccess: "full" });
    grist.onOptions((options) => {
      const saved = options && options[WIDGET_OPTIONS_KEY];
      if (isValidFieldsConfig(saved)) {
        setFieldsConfig(saved);
      } else {
        setFieldsConfig(null);
        setCurrentStep("fields_config");
      }
    });
  }, []);

  useEffect(() => {
    if (!fieldsConfig || typeof grist === "undefined") {
      return;
    }
    gristReady(
      "full",
      buildColumnMappingNames(fieldsConfig.input, fieldsConfig.outputs),
    );
    grist.onRecords((newRecords, gristMappings) => {
      setRecords(newRecords);
      setMappings(gristMappings);
    });
    grist.onRecord((rec: RowRecord | null) => {
      setRecord(rec);
    });
    setCurrentStep((prevStep) =>
      prevStep === "fields_config" ? "loading" : prevStep,
    );
  }, [fieldsConfig]);

  useEffect(() => {
    if (!fieldsConfig) {
      return;
    }
    if (["loading", "config"].includes(currentStep)) {
      if (mappingsIsReady(mappings, fieldsConfig.outputs)) {
        setCurrentStep("menu");
      } else {
        setCurrentStep("config");
      }
    }
  }, [mappings, currentStep, fieldsConfig]);

  const goBackToMenu = () => {
    setCurrentStep("menu");
  };

  const editFieldsConfig = () => {
    setCurrentStep("fields_config");
  };

  const saveFieldsConfig = async (config: SireneFieldsConfig) => {
    await grist.setOptions({ [WIDGET_OPTIONS_KEY]: config });
    setFieldsConfig(config);
  };

  const globalResearch = async () => {
    if (!fieldsConfig) {
      return;
    }
    setCurrentStep("global_processing");
    setGlobalInProgress(true);
    const callBackFunction = (
      dataFromApi: UncleanedRecord<NormalizedSireneResult>[],
      at: number,
      on: number,
    ) => {
      setAtOnProgress([at, on]);
      const { clean, dirty, noResult } = cleanAndSortRecords(
        dataFromApi,
        isDoubtfulResults,
        areTooCloseResults,
      );
      writeCleanDataInTable(clean);
      setDirtyData((prevState) => ({ ...prevState, ...dirty }));
      setNoResultData((prevState) => ({ ...prevState, ...noResult }));
    };
    await getSireneResultsForRecords(
      records,
      mappings!,
      callBackFunction,
      areCollectivitesTerritoriales,
      fieldsConfig.input,
      fieldsConfig.outputs,
    );
    setGlobalInProgress(false);
  };

  const recordResearch = async () => {
    if (record && fieldsConfig) {
      setCurrentStep("specific_processing");
      // Delete data corresponding to this record in dirty and noResult states
      setDirtyData((prevState) => {
        delete prevState[record.id];
        return prevState;
      });
      setNoResultData((prevState) => {
        delete prevState[record.id];
        return prevState;
      });
      const recordUncleanedData = await getSireneResultsForRecord(
        record,
        mappings!,
        areCollectivitesTerritoriales,
        fieldsConfig.input,
        fieldsConfig.outputs,
      );
      const { clean, dirty, noResult } = cleanAndSortRecords(
        [recordUncleanedData],
        isDoubtfulResults,
        areTooCloseResults,
      );
      if (clean) {
        writeCleanDataInTable(clean);
      }
      if (dirty) {
        setDirtyData((prevState) => ({ ...prevState, ...dirty }));
      }
      if (noResult) {
        setNoResultData((prevState) => ({ ...prevState, ...noResult }));
      }
    }
  };

  const writeCleanDataInTable = (cleanData: {
    [recordId: number]: CleanRecord<NormalizedSireneResult>;
  }) => {
    if (!fieldsConfig) {
      return;
    }
    Object.values(cleanData).forEach(
      (clean: CleanRecord<NormalizedSireneResult>) => {
        if (clean.siren) {
          const data: { [key: string]: string | undefined } = {};
          fieldsConfig.outputs.forEach((key) => {
            data[key] = clean[key];
          });
          addObjectInRecord(clean.recordId, grist.mapColumnNamesBack(data));
        } else {
          setNoResultData((prevValue) => ({
            ...prevValue,
            [clean.recordId]: {
              recordId: clean.recordId,
              noResultMessage: NO_DATA_MESSAGES.NO_DESTINATION_DATA,
              result: clean,
            },
          }));
        }
      },
    );
  };

  const passDataFromDirtyToClean = (
    sireneResultSelected: NormalizedSireneResult,
    initalData: DirtyRecord<NormalizedSireneResult>,
  ) => {
    // Remove the record from dirtyData
    setDirtyData(() => {
      const { [initalData.recordId]: id, ...newDirtyData } = dirtyData;
      return newDirtyData;
    });
    writeCleanDataInTable({
      [initalData.recordId]: {
        ...sireneResultSelected,
        recordId: initalData.recordId,
        sourceData: initalData.sourceData,
      },
    });
  };

  const editFieldsConfigButton = (
    <div className="centered-column">
      <button className="secondary" onClick={editFieldsConfig}>
        Modifier les champs source/destination
      </button>
    </div>
  );

  const collectivitesTerritorialesCheckbox = fieldsConfig?.input === "nom" && (
    <div className="centered-column">
      <CheckboxParams
        label="La recherche concerne des collectivités territoriales"
        value={areCollectivitesTerritoriales}
        onChange={() =>
          setAreCollectivitesTerritoriales(!areCollectivitesTerritoriales)
        }
      />
    </div>
  );

  return currentStep === "loading" ? (
    <Title title={TITLE} />
  ) : currentStep === "fields_config" ? (
    <div>
      <Title title={TITLE} />
      <FieldsConfiguration
        initialConfig={fieldsConfig}
        onValidate={saveFieldsConfig}
      />
      <MyFooter />
    </div>
  ) : currentStep === "config" ? (
    <div>
      <Title title={TITLE} />
      {editFieldsConfigButton}
      <Configuration>
        <Instructions />
      </Configuration>
      <MyFooter />
    </div>
  ) : currentStep === "menu" ? (
    <div>
      <Title title={TITLE} />
      {editFieldsConfigButton}
      {collectivitesTerritorialesCheckbox}
      <div className="menu">
        <div className="centered-column">
          <Image priority src={globalSvg} alt="Traitement global" />
          <h2>Traitement global</h2>
          <p>
            Lancer une recherche globale sur l&apos;ensemble des lignes
            n&apos;ayant pas de données de renseignées.
          </p>
          <button className="primary" onClick={globalResearch}>
            Recherche globale
          </button>
        </div>
        <div className="divider"></div>
        <div className="centered-column">
          <Image priority src={specificSvg} alt="Traitement spécifique" />
          <h2>Traitement spécifique</h2>
          <p>
            Lancer une recherche spécifique des données de la ligne
            sélectionnée.
          </p>
          <button className="primary" onClick={recordResearch}>
            Recherche spécifique
          </button>
        </div>
      </div>
      <Instructions />
      <MyFooter />
    </div>
  ) : currentStep === "global_processing" ? (
    <div>
      <div className="centered-column">
        <Title title={TITLE} />
        {collectivitesTerritorialesCheckbox}
        <Image priority src={globalSvg} alt="traitement global" />
        <GenericGlobalProcessing
          dirtyData={dirtyData}
          noResultData={noResultData}
          globalInProgress={globalInProgress}
          atOnProgress={atOnProgress}
          recordResearch={recordResearch}
          goBackToMenu={goBackToMenu}
          researchObjectName="Les données Sirene"
        />
      </div>
      <MyFooter />
    </div>
  ) : (
    currentStep === "specific_processing" &&
    fieldsConfig && (
      <div>
        <div className="centered-column">
          <Title title={TITLE} />
          {collectivitesTerritorialesCheckbox}
          <Image priority src={specificSvg} alt="traitement spécifique" />
          <SpecificProcessing
            mappings={mappings}
            record={record}
            outputs={fieldsConfig.outputs}
            dirtyData={record && dirtyData[record.id]}
            noResultData={record && noResultData[record.id]}
            passDataFromDirtyToClean={passDataFromDirtyToClean}
            recordResearch={recordResearch}
            goBackToMenu={goBackToMenu}
          />
        </div>
        <MyFooter />
      </div>
    )
  );
};

export default Sirene;
