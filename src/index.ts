/**
 * mbongo - Point d'entrée principal
 * 
 * Ce fichier est le point d'entrée de l'application.
 * Il initialise et configure tous les composants nécessaires.
 * 
 * @packageDocumentation
 */

import { logger } from './infrastructure/config/logger';

/**
 * Point d'entrée principal de l'application
 * 
 * @returns Promise<void> - Résout quand l'application est prête
 */
async function main(): Promise<void> {
  try {
    logger.info('🚀 Initialisation de mbongo...');
    
    // TODO: Initialiser les composants ici
    // Exemple:
    // await initializeDatabase();
    // await initializeCache();
    // await initializeServer();
    
    logger.info('✅ mbongo initialisé avec succès!');
    logger.info('📝 Pour commencer, créez une spec dans docs/specs/');
    logger.info('💡 Utilisez: cp skills/spec-driven-development/SPEC_TEMPLATE.md docs/specs/votre-feature/SPEC.md');
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation de mbongo:', error);
    process.exit(1);
  }
}

// Exécuter le point d'entrée
main().catch((error) => {
  logger.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

// Export pour les tests
export { main };
