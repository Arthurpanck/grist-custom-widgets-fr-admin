"use client";

import { FC } from "react";
import { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { OUTPUT_FIELD_LABELS, SOURCE_COLUMN_NAME } from "./constants";
import { NormalizedSireneResult, SireneFieldKey } from "./types";
import GenericChoiceBanner from "../../components/cleanData/GenericChoiceBanner";
import { DirtyRecord, NoResultRecord } from "../../lib/cleanData/types";
import RecordName from "../../components/RecordName";
import GenericSpecificProcessing from "../../components/cleanData/GenericSpecificProcessing";

export const SpecificProcessing: FC<{
  mappings: WidgetColumnMap | null;
  record: RowRecord | null | undefined;
  outputs: SireneFieldKey[];
  dirtyData: DirtyRecord<NormalizedSireneResult> | null | undefined;
  noResultData: NoResultRecord<NormalizedSireneResult> | null | undefined;
  passDataFromDirtyToClean: (
    sireneResultSelected: NormalizedSireneResult,
    initalData: DirtyRecord<NormalizedSireneResult>,
  ) => void;
  recordResearch: () => void;
  goBackToMenu: () => void;
}> = ({
  mappings,
  record,
  outputs,
  dirtyData,
  noResultData,
  passDataFromDirtyToClean,
  recordResearch,
  goBackToMenu,
}) => {
  const recordNameNode = (
    <RecordName
      record={record}
      columnName={mappings && mappings[SOURCE_COLUMN_NAME]}
    />
  );

  const primaryOutput = outputs[0];

  const isResultFind = () => {
    if (record && mappings && primaryOutput) {
      const columnName = mappings[primaryOutput];
      if (typeof columnName === "string" && record[columnName]) {
        return true;
      }
    }
    return false;
  };

  const recordFindNode = (
    <div>Les données de {recordNameNode} ont bien été renseignées.</div>
  );

  const choiceBannerNode = record && dirtyData && (
    <GenericChoiceBanner<NormalizedSireneResult>
      dirtyData={dirtyData}
      passDataFromDirtyToClean={passDataFromDirtyToClean}
      option={{
        choiceValueKey: "siret",
        withChoiceTagLegend: true,
        choiceTagLegend: "SIRET",
        choiceTagKey: "siret",
      }}
      itemDisplay={(item: NormalizedSireneResult) => {
        return (
          <div>
            <b>{item.label}</b>
            {outputs.map(
              (key) =>
                item[key] && (
                  <span key={key}>
                    {" "}
                    — {OUTPUT_FIELD_LABELS[key]} : {item[key]}
                  </span>
                ),
            )}
          </div>
        );
      }}
    />
  );

  return (
    <GenericSpecificProcessing<NormalizedSireneResult>
      record={record}
      recordNameNode={recordNameNode}
      noResultData={noResultData}
      recordResearch={recordResearch}
      goBackToMenu={goBackToMenu}
      isResultFind={isResultFind}
      recordFindNode={recordFindNode}
      choiceBannerNode={choiceBannerNode}
    />
  );
};
