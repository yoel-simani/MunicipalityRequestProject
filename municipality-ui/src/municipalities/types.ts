import type { MunicipalityConfig, TemplateConfig, TemplateDefinition, TemplateFieldConfig } from '../config/municipalityConfig';

export type MunicipalityOverrides = Omit<Partial<MunicipalityConfig>, 'templateConfig'> & {
  templateConfig?: Partial<TemplateConfig> & {
    globalFields?: Partial<TemplateConfig['globalFields']>;
    templates?: {
      [patternId: number]: Partial<TemplateDefinition> & {
        fields?: Partial<TemplateFieldConfig>[];
      };
    };
  };
};
