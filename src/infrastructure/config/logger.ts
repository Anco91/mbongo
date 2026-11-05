/**
 * Logger Configuration
 * 
 * Configuration centralisée du logger pour l'application.
 * Utilise la bibliothèque 'pino' pour un logging performant.
 * 
 * @module infrastructure/config
 */

import pino from 'pino';

/**
 * Niveaux de log disponibles
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

/**
 * Configuration du logger
 */
export interface LoggerConfig {
  level: LogLevel;
  prettyPrint?: boolean;
  colorize?: boolean;
  timestamp?: boolean;
}

/**
 * Configuration par défaut
 */
const defaultConfig: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  prettyPrint: process.env.NODE_ENV === 'development',
  colorize: process.env.NODE_ENV === 'development',
  timestamp: true,
};

/**
 * Instance principale du logger
 */
export const logger = pino({
  level: defaultConfig.level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: defaultConfig.colorize,
      ignore: 'pid,hostname',
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
    },
  },
  timestamp: defaultConfig.timestamp ? pino.stdTimeFunctions.isoTime : undefined,
});

/**
 * Créer un logger avec un contexte spécifique
 * 
 * @param context - Contexte pour le logger (ex: 'UserService', 'API')
 * @returns pino.Logger - Instance du logger avec contexte
 * 
 * @example
 * ```typescript
 * const userLogger = createLogger('UserService');
 * userLogger.info('Création d\'un utilisateur...');
 * ```
 */
export function createLogger(context: string): pino.Logger {
  return logger.child({ context });
}

/**
 * Créer un logger pour les tests
 * 
 * @returns pino.Logger - Logger silencieux pour les tests
 */
export function createTestLogger(): pino.Logger {
  return pino({
    level: 'silent',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: false,
        ignore: 'pid,hostname',
      },
    },
  });
}

export default logger;
