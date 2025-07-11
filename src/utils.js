/* eslint-disable no-bitwise */
import { compress as lzStringCompress, decompress as lzStringDecompress } from '@kalkih/lz-string';

const getMin = (arr, val) => arr.reduce((min, p) => (
  Number(p[val]) < Number(min[val]) ? p : min
), arr[0]);
const getAvg = (arr, val) => arr.reduce((sum, p) => (
  sum + Number(p[val])
), 0) / arr.length;
const getMax = (arr, val) => arr.reduce((max, p) => (
  Number(p[val]) > Number(max[val]) ? p : max
), arr[0]);
const getTime = (date, extra, locale = 'en-US') => date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric', ...extra });
const getMilli = hours => hours * 60 ** 2 * 10 ** 3;

const compress = data => lzStringCompress(JSON.stringify(data));

const decompress = data => (typeof data === 'string' ? JSON.parse(lzStringDecompress(data)) : data);

const getFirstDefinedItem = (...collection) => collection.find(item => typeof item !== 'undefined');

// eslint-disable-next-line max-len
const compareArray = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);

const log = (message) => {
  // eslint-disable-next-line no-console
  console.warn('mini-graph-card: ', message);
};

const isTemplate = (value) => {
  if (typeof value !== 'string') return false;
  return value.includes('{{') || value.includes('{%');
};

const templateRegex = /\{\{.*?\}\}|\{%.*?%\}/s;
const hasTemplate = value => (typeof value === 'string' && templateRegex.test(value));

const evaluateTemplate = async (template, hass) => {
  if (!hass || !hass.callWS) {
    throw new Error('Home Assistant instance not available for template evaluation');
  }

  try {
    const result = await hass.callWS({
      type: 'render_template',
      template,
    });
    return result;
  } catch (error) {
    log(`Template evaluation failed: ${error.message}`);
    return null;
  }
};

const validateNumericField = (value, fieldName, fallback) => {
  // Ensure basic numeric validity
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return fallback;
  }

  // Field-specific validation
  switch (fieldName) {
    case 'hours_to_show':
      // Must be positive, reasonable upper limit
      if (value <= 0) return fallback;
      if (value > 8760) return 8760; // Max 1 year
      return Math.max(0.1, value);

    case 'points_per_hour':
      // Must be positive, reasonable limits
      if (value <= 0) return fallback;
      if (value > 3600) return 3600; // Max 1 point per second
      return Math.max(0.001, value);

    case 'height':
      // Must be positive, reasonable limits
      if (value < 0) return fallback;
      if (value > 2000) return 2000; // Max height
      return Math.max(0, value);

    case 'font_size':
    case 'font_size_header':
      // Must be positive
      if (value <= 0) return fallback;
      if (value > 200) return 200; // Max font size
      return Math.max(1, value);

    case 'line_width':
      // Must be positive
      if (value <= 0) return fallback;
      if (value > 50) return 50; // Max line width
      return Math.max(0.1, value);

    case 'bar_spacing':
      // Can be zero or positive
      if (value < 0) return fallback;
      if (value > 100) return 100; // Max spacing
      return Math.max(0, value);

    case 'decimals':
      // Must be non-negative integer
      if (value < 0) return fallback;
      if (value > 10) return 10; // Max decimal places
      return Math.max(0, Math.floor(value));

    case 'value_factor':
      // Can be any finite number
      return value;

    default:
      // Generic positive number validation
      if (value < 0) return fallback;
      return value;
  }
};

const processTemplateValue = async (value, hass, fallback = null, fieldName = null) => {
  if (!isTemplate(value)) {
    return value;
  }

  try {
    const evaluated = await evaluateTemplate(value, hass);
    if (evaluated === null) {
      return fallback;
    }

    // Try to convert to number if it looks numeric
    const numValue = parseFloat(evaluated);
    if (!Number.isNaN(numValue) && Number.isFinite(numValue)) {
      // Field-specific validation
      const validatedValue = validateNumericField(numValue, fieldName, fallback);
      if (validatedValue !== numValue) {
        log(`Template value ${numValue} for field ${fieldName} was corrected to ${validatedValue}`);
      }
      return validatedValue;
    }

    return evaluated;
  } catch (error) {
    log(`Template processing failed: ${error.message}`);
    return fallback;
  }
};

export {
  getMin, getAvg, getMax, getTime, getMilli, compress, decompress, log,
  getFirstDefinedItem,
  compareArray,
  isTemplate, hasTemplate, evaluateTemplate, processTemplateValue, validateNumericField,
};
