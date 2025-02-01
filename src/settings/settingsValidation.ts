import { LatexTranslatorSettings } from './settings';
import { logger } from '@utils/logger';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSettings(
  settings: LatexTranslatorSettings
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Validate environment mappings
  Object.entries(settings.environmentConversion.customMappings).forEach(
    ([source, target]) => {
      if (!/^[a-zA-Z][a-zA-Z0-9*]*$/.test(source)) {
        result.errors.push(
          `Invalid environment name: ${source}. Must start with a letter and contain only letters, numbers, or *`
        );
      }
      if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(target)) {
        result.errors.push(
          `Invalid target environment: ${target}. Must start with a letter and contain only letters, numbers, or hyphens`
        );
      }
    }
  );

  // Validate citation formats
  Object.entries(settings.citation.customFormats).forEach(([cmd, format]) => {
    if (!/^[a-zA-Z][a-zA-Z]*$/.test(cmd)) {
      result.errors.push(
        `Invalid citation command: ${cmd}. Must contain only letters`
      );
    }
    if (!format.includes('$')) {
      result.warnings.push(
        `Citation format for ${cmd} doesn't contain any placeholders ($key, $author, etc.)`
      );
    }
  });

  // Validate reference formats
  Object.entries(settings.labelAndReference.customReferenceFormats).forEach(
    ([type, format]) => {
      if (!/^[a-zA-Z][a-zA-Z]*$/.test(type)) {
        result.errors.push(
          `Invalid reference type: ${type}. Must contain only letters`
        );
      }
      if (!format.includes('$')) {
        result.warnings.push(
          `Reference format for ${type} doesn't contain any placeholders ($label, $number, etc.)`
        );
      }
    }
  );

  // Validate auto-numbering settings
  Object.entries(settings.labelAndReference.autoNumbering).forEach(
    ([counter, value]) => {
      if (!Number.isInteger(value) || value < 1) {
        result.errors.push(
          `Invalid starting number for ${counter}: ${value}. Must be a positive integer`
        );
      }
    }
  );

  result.isValid = result.errors.length === 0;
  return result;
}

export function validateAndSanitizeFormat(
  format: string,
  allowedPlaceholders: string[]
): string {
  // Remove any potentially dangerous characters
  let sanitized = format.replace(/[<>&]/g, '');

  // Check for valid placeholders
  const placeholderRegex = /\$([a-zA-Z]+)/g;
  let match;
  while ((match = placeholderRegex.exec(format)) !== null) {
    if (!allowedPlaceholders.includes(match[1])) {
      logger.warning(`Unknown placeholder: $${match[1]}`);
      // Replace unknown placeholder with first allowed placeholder
      sanitized = sanitized.replace(
        new RegExp(`\\$${match[1]}`, 'g'),
        `$${allowedPlaceholders[0]}`
      );
    }
  }

  return sanitized;
}

export function exportSettings(settings: LatexTranslatorSettings): string {
  try {
    return JSON.stringify(settings, null, 2);
  } catch (error) {
    logger.error('Error exporting settings', error);
    throw new Error('Failed to export settings');
  }
}

export function importSettings(json: string): LatexTranslatorSettings {
  try {
    const imported = JSON.parse(json);
    const validation = validateSettings(imported);

    if (!validation.isValid) {
      throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
    }

    return imported;
  } catch (error) {
    logger.error('Error importing settings', error);
    throw new Error(
      'Failed to import settings: Invalid JSON or settings format'
    );
  }
}
