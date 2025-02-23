/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
import { MintAddress, Trait } from "@/lib/token";

const initialTraits: Trait[] = [
  {
    key: "",
    value: "",
    isPrivate: false,
  },
];

export interface TraitsModalProps {
  onSubmit: (traits: Trait[]) => void;
  title?: string;
  buttonText: string;
}

export function TraitModalForm({
  onSubmit,
  title,
  buttonText,
}: TraitsModalProps) {
  const [traits, setTraits] = useState<Trait[]>(initialTraits);

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(
        traits.filter((trait) => trait.key !== "" && trait.value !== "")
      );
    }
  };

  return (
    <div
      className="modal fade"
      id="TraitsModal"
      tabIndex={-1}
      aria-labelledby="addTraitsLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog max-w-3xl">
        <div className="modal-content">
          <div className="modal-header">
            {title && (
              <h5 className="modal-title text-sm" id="addPropertiesLabel">
                {title}
              </h5>
            )}
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="h-6 w-6 fill-jacarta-700 dark:fill-white"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" />
              </svg>
            </button>
          </div>

          <div className="modal-body p-6">
            <div className="relative my-3 flex items-center" key="title-mint">
              <div className="w-2/6 flex justify-center">
                <label className="mb-3 text-sm block font-display font-semibold text-jacarta-700 dark:text-white text-center">
                  Key
                </label>
              </div>

              <div className="w-3/6 flex justify-center">
                <label className="mb-3 text-sm block font-display  font-semibold text-jacarta-700 dark:text-white text-center">
                  Value
                </label>
              </div>

              <div className="w-1/6 flex justify-center items-center">
                <label className="mb-3 text-sm block font-display  font-semibold text-jacarta-700 dark:text-white text-center">
                  Private
                </label>
              </div>
            </div>
            {traits.map((trait, index) => (
              <div className="relative  flex items-center" key={index}>
                <button
                  onClick={() =>
                    setTraits((items) => {
                      const newTraits = [...items];
                      newTraits.splice(index, 1);
                      return newTraits;
                    })
                  }
                  className="flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-l-lg border border-r-0 border-jacarta-100 bg-jacarta-50 hover:bg-jacarta-100 dark:border-jacarta-600 dark:bg-jacarta-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    className="h-6 w-6 fill-jacarta-500 dark:fill-jacarta-300"
                  >
                    <path fill="none" d="M0 0h24v24H0z"></path>
                    <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"></path>
                  </svg>
                </button>

                <div className="w-2/5">
                  <input
                    type="text"
                    className="h-12 w-full border border-r-0 border-jacarta-100 text-sm focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder-jacarta-300"
                    placeholder="key (max 30 chars)"
                    value={trait.key}
                    onChange={(e) => {
                      setTraits((items) => {
                        const newTraits = [...items];
                        newTraits[index].key = e.target.value.slice(0, 30);
                        return newTraits;
                      });
                    }}
                  />
                </div>

                <div className="w-2/5">
                  <input
                    type="text"
                    className="h-12 w-full rounded-r-lg border border-jacarta-100 text-sm focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder-jacarta-300"
                    placeholder="value (max 30 chars)"
                    value={trait.value}
                    onChange={(e) => {
                      setTraits((items) => {
                        const newTraits = [...items];
                        newTraits[index].value = e.target.value.slice(0, 30);
                        return newTraits;
                      });
                    }}
                  />
                </div>
                <div className="w-1/5 flex items-center justify-center">
                  <input
                    type="checkbox"
                    value="checkbox"
                    name="private"
                    checked={trait.isPrivate ?? false}
                    onChange={(e) => {
                      setTraits((items) => {
                        const newTraits = [...items];
                        newTraits[index].isPrivate = e.target.checked;
                        return newTraits;
                      });
                    }}
                    className="relative h-6 w-[2.625rem] cursor-pointer appearance-none rounded-full border-none bg-jacarta-100 after:absolute after:top-[0.1875rem] after:left-[0.1875rem] after:h-[1.125rem] after:w-[1.125rem] after:rounded-full after:bg-jacarta-400 after:transition-all checked:bg-accent checked:bg-none checked:after:left-[1.3125rem] checked:after:bg-white checked:hover:bg-accent focus:ring-transparent focus:ring-offset-0 checked:focus:bg-accent"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                setTraits((items) => [...items, { key: "", value: "" }])
              }
              className="mt-2 rounded-full border-2 border-accent py-2 px-8 text-center text-sm font-semibold text-accent transition-all hover:bg-accent hover:text-white"
            >
              Add More
            </button>
          </div>

          <div className="modal-footer">
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                data-bs-dismiss="modal"
                className="rounded-full bg-accent py-3 px-8 text-center font-semibold text-white shadow-accent-volume transition-all hover:bg-accent-dark"
                onClick={handleSubmit}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
