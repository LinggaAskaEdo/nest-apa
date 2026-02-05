import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

export interface YamlConfig {
  [key: string]: any;
}

export function loadYamlConfig(): YamlConfig {
  const environment = process.env.NODE_ENV || 'development';
  const configDir = path.join(process.cwd(), 'config');

  // Load base configuration
  const baseConfigPath = path.join(configDir, 'application.yaml');
  let config: YamlConfig = {};

  if (fs.existsSync(baseConfigPath)) {
    const baseConfig = yaml.load(fs.readFileSync(baseConfigPath, 'utf8')) as YamlConfig;
    config = { ...config, ...baseConfig };
  }

  // Load environment-specific configuration
  const envConfigPath = path.join(configDir, `application-${environment}.yaml`);
  if (fs.existsSync(envConfigPath)) {
    const envConfig = yaml.load(fs.readFileSync(envConfigPath, 'utf8')) as YamlConfig;
    config = deepMerge(config, envConfig);
  }

  // Replace environment variable placeholders
  config = replaceEnvVariables(config);

  return config;
}

/**
 * Deep merge two objects
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

/**
 * Check if value is an object
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Replace environment variable placeholders
 * Format: ${ENV_VAR:default_value} or ${ENV_VAR}
 */
function replaceEnvVariables(obj: any): any {
  if (typeof obj === 'string') {
    return replaceEnvVariable(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceEnvVariables(item));
  }

  if (isObject(obj)) {
    const result: any = {};
    for (const key in obj) {
      result[key] = replaceEnvVariables(obj[key]);
    }
    return result;
  }

  return obj;
}

/**
 * Replace a single environment variable placeholder
 */
function replaceEnvVariable(value: string): any {
  const regex = /\$\{([^:}]+)(?::([^}]*))?\}/g;

  let result = value;
  let match;

  while ((match = regex.exec(value)) !== null) {
    const envVar = match[1];
    const defaultValue = match[2] || '';
    const envValue = process.env[envVar];

    const replacementValue = envValue !== undefined ? envValue : defaultValue;
    result = result.replace(match[0], replacementValue);
  }

  // Try to convert to appropriate type
  if (result === 'true') return true;
  if (result === 'false') return false;
  if (!isNaN(Number(result)) && result !== '') return Number(result);

  return result;
}
