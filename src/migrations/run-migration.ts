import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MigrateOrganizationalObjectivesService } from './migrate-organizational-objectives.service';

/**
 * CLI script to run the organizational objectives migration
 *
 * Usage:
 *   npm run ts-node src/migrations/run-migration.ts preview
 *   npm run ts-node src/migrations/run-migration.ts migrate
 *   npm run ts-node src/migrations/run-migration.ts rollback
 */
async function runMigration() {
  const command = process.argv[2];

  if (!command || !['preview', 'migrate', 'rollback'].includes(command)) {
    console.error('Invalid command. Usage:');
    console.error('   npm run ts-node src/migrations/run-migration.ts preview');
    console.error('   npm run ts-node src/migrations/run-migration.ts migrate');
    console.error('   npm run ts-node src/migrations/run-migration.ts rollback');
    process.exit(1);
  }

  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    });

    const migrationService = app.get(MigrateOrganizationalObjectivesService);

    switch (command) {
      case 'preview':
        const preview = await migrationService.previewMigration();

        console.log(`Organizations to migrate: ${preview.organizationsToMigrate}`);
        console.log('\nSample migrations:');

        preview.sampleObjectives.forEach((sample, index) => {
          console.log(`\n${index + 1}. Organization: ${sample.organizationName}`);
          console.log(`   Original: ${sample.originalObjectives.substring(0, 100)}${sample.originalObjectives.length > 100 ? '...' : ''}`);
          console.log(`   Parsed into ${sample.parsedObjectives.length} structured objectives:`);
          sample.parsedObjectives.forEach((obj, objIndex) => {
            console.log(`     ${objIndex + 1}) ${obj.title} (Priority: ${obj.priority})`);
          });
        });
        break;

      case 'migrate':
        const confirm = await askConfirmation('Are you sure you want to proceed with the migration? (y/N): ');

        if (confirm) {
          const results = await migrationService.migrateObjectives();

          if (results.errors.length > 0) {
            console.error('Some errors occurred during migration.');
            process.exit(1);
          }
        } else {
          console.log('Migration cancelled by user');
        }
        break;

      case 'rollback':
        const rollbackConfirm = await askConfirmation('Are you sure you want to rollback the migration? This will convert structured objectives back to strings. (y/N): ');

        if (rollbackConfirm) {
          const results = await migrationService.rollbackMigration();

          if (results.errors.length > 0) {
            console.error('Some errors occurred during rollback.');
            process.exit(1);
          }
        } else {
          console.log('Rollback cancelled by user');
        }
        break;
    }

    await app.close();
    process.exit(0);

  } catch (error) {
    console.error('Migration script failed:', error);
    process.exit(1);
  }
}

function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(question);

    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === 'y' || answer === 'yes');
    });
  });
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration();
}