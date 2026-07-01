"use client";

import { FC, useState } from "react";
import { INPUT_FIELD_OPTIONS, OUTPUT_FIELD_OPTIONS } from "./constants";
import { SireneFieldKey, SireneFieldsConfig, SireneInputKey } from "./types";

export const FieldsConfiguration: FC<{
  initialConfig: SireneFieldsConfig | null;
  onValidate: (config: SireneFieldsConfig) => void;
}> = ({ initialConfig, onValidate }) => {
  const [input, setInput] = useState<SireneInputKey>(
    initialConfig?.input ?? "nom",
  );
  const [outputs, setOutputs] = useState<Set<SireneFieldKey>>(
    new Set(initialConfig?.outputs ?? []),
  );

  const availableOutputs = OUTPUT_FIELD_OPTIONS.filter(
    (option) => option.key !== input,
  );

  const handleInputChange = (key: SireneInputKey) => {
    setInput(key);
    setOutputs((prev) => {
      const next = new Set(prev);
      next.delete(key as unknown as SireneFieldKey);
      return next;
    });
  };

  const toggleOutput = (key: SireneFieldKey) => {
    setOutputs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="centered-column">
      <p>
        Choisissez le champ que vous possédez déjà (la donnée source) ainsi
        que les informations que vous souhaitez récupérer depuis l&apos;api
        Recherche d&apos;entreprises.
      </p>
      <div className="fields-configuration">
        <div className="fields-configuration-column">
          <h3>Champ source</h3>
          <div className="radio-button">
            {INPUT_FIELD_OPTIONS.map((option) => (
              <label key={option.key}>
                <input
                  type="radio"
                  name="sireneInputField"
                  checked={input === option.key}
                  onChange={() => handleInputChange(option.key)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
        <div className="fields-configuration-column">
          <h3>Champs à récupérer</h3>
          <div className="radio-button">
            {availableOutputs.map((option) => (
              <label key={option.key}>
                <input
                  type="checkbox"
                  checked={outputs.has(option.key)}
                  onChange={() => toggleOutput(option.key)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>
      <button
        className="primary"
        disabled={outputs.size === 0}
        onClick={() => onValidate({ input, outputs: Array.from(outputs) })}
      >
        Valider
      </button>
    </div>
  );
};
