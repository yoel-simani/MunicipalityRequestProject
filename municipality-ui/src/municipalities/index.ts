import type { MunicipalityConfig, TemplateConfig, TemplateDefinition, TemplateFieldConfig } from '../config/municipalityConfig';
import type { MunicipalityOverrides } from './types';
import { defaultMunicipalityConfig } from './default/defaults';
import { municipality390000Overrides } from './390000/overrides';
import { municipality813510Overrides } from './813510/overrides';

const mergeTemplateFields = (
  baseFields: TemplateFieldConfig[],
  overrideFields: Partial<TemplateFieldConfig>[]
): TemplateFieldConfig[] => {
  const overridesByName = new Map(
    overrideFields.filter((field) => field.name).map((field) => [field.name as string, field])
  );
  const baseNames = new Set(baseFields.map((field) => field.name));

  const merged = baseFields.map((field) => {
    const override = overridesByName.get(field.name);
    return override ? { ...field, ...override } : field;
  });

  const additions = overrideFields
    .filter((field) => field.name && !baseNames.has(field.name as string))
    .map((field) => field as TemplateFieldConfig);

  return merged.concat(additions);
};

const mergeTemplateDefinition = (
  baseTemplate: TemplateDefinition,
  overrideTemplate?: Partial<TemplateDefinition> & { fields?: Partial<TemplateFieldConfig>[] }
): TemplateDefinition => {
  if (!overrideTemplate) return baseTemplate;

  return {
    ...baseTemplate,
    ...overrideTemplate,
    fields: overrideTemplate.fields
      ? mergeTemplateFields(baseTemplate.fields, overrideTemplate.fields)
      : baseTemplate.fields,
    requiredAttachments: overrideTemplate.requiredAttachments ?? baseTemplate.requiredAttachments,
  };
};

const buildMunicipalityConfig = (
  base: MunicipalityConfig,
  overrides: MunicipalityOverrides
): MunicipalityConfig => {
  const baseTemplates = base.templateConfig.templates;
  const overrideTemplates = overrides.templateConfig?.templates || {};
  const mergedTemplates: TemplateConfig['templates'] = { ...baseTemplates };

  Object.entries(overrideTemplates).forEach(([patternId, overrideTemplate]) => {
    const numericId = Number(patternId);
    const baseTemplate = baseTemplates[numericId];
    if (baseTemplate) {
      mergedTemplates[numericId] = mergeTemplateDefinition(baseTemplate, overrideTemplate);
    } else {
      mergedTemplates[numericId] = overrideTemplate as TemplateDefinition;
    }
  });

  return {
    ...base,
    ...overrides,
    templateConfig: {
      ...base.templateConfig,
      ...overrides.templateConfig,
      globalFields: {
        ...base.templateConfig.globalFields,
        ...overrides.templateConfig?.globalFields,
      },
      templates: mergedTemplates,
    },
    theme: {
      ...base.theme,
      ...overrides.theme,
    },
  };
};

// Registry of all municipalities
export const municipalities: { [id: string]: MunicipalityConfig } = {
  default: defaultMunicipalityConfig,
  '390000': buildMunicipalityConfig(defaultMunicipalityConfig, municipality390000Overrides),
  '813510': buildMunicipalityConfig(defaultMunicipalityConfig, municipality813510Overrides),
  // Add more municipalities here:
  // '400000': buildMunicipalityConfig(defaultMunicipalityConfig, municipality400000Overrides),
};

// Helper function to get municipality by ID
export const getMunicipalityById = (id: string): MunicipalityConfig | undefined => {
  return municipalities[id];
};

// Helper function to get all municipality IDs
export const getAllMunicipalityIds = (): string[] => {
  return Object.keys(municipalities);
};
