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
  if (!hass || !hass.callService) {
    throw new Error('Home Assistant instance not available for template evaluation');
  }

  try {
    const result = await hass.callService('template', 'render', {
      template,
    });
    return result.response;
  } catch (error) {
    log(`Template evaluation failed: ${error.message}`);
    return null;
  }
};

const processTemplateValue = async (value, hass, fallback = null) => {
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
      return numValue;
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
  isTemplate, hasTemplate, evaluateTemplate, processTemplateValue,
};
