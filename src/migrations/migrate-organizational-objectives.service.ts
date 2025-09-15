import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
  OrganizationalObjective,
  ObjectivePriority,
  ObjectiveStatus,
} from '@domain/organizations/entities/organization.entity';

@Injectable()
export class MigrateOrganizationalObjectivesService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  /**
   * Migrates existing string-based organizational objectives to structured format
   */
  async migrateObjectives(): Promise<{
    processed: number;
    migrated: number;
    skipped: number;
    errors: string[];
  }> {
    console.log('🔄 Starting migration of organizational objectives...');

    const results = {
      processed: 0,
      migrated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    try {
      // Find organizations that have legacy string objectives but no structured objectives
      const organizations = await this.organizationModel.find({
        organizationalObjectives: { $exists: true, $ne: null },
        $and: [
          { organizationalObjectives: { $ne: '' } },
          {
            $or: [
              { objectives: { $exists: false } },
              { objectives: { $size: 0 } },
              { objectives: null },
            ],
          },
        ],
      });

      console.log(`📊 Found ${organizations.length} organizations to migrate`);

      for (const org of organizations) {
        results.processed++;
        console.log(`\n🏢 Processing organization: ${org.name} (${org._id})`);

        try {
          const structuredObjectives = this.parseStringObjectives(
            org.organizationalObjectives!,
          );

          if (structuredObjectives.length === 0) {
            console.log(`⚠️  No valid objectives found for ${org.name}`);
            results.skipped++;
            continue;
          }

          // Update the organization with structured objectives
          await this.organizationModel.updateOne(
            { _id: org._id },
            {
              $set: {
                objectives: structuredObjectives,
              },
            },
          );

          console.log(
            `✅ Migrated ${structuredObjectives.length} objectives for ${org.name}`,
          );
          results.migrated++;
        } catch (error) {
          const errorMsg = `Failed to migrate ${org.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }

      console.log('\n📈 Migration Summary:');
      console.log(`   📊 Total processed: ${results.processed}`);
      console.log(`   ✅ Successfully migrated: ${results.migrated}`);
      console.log(`   ⏭️  Skipped: ${results.skipped}`);
      console.log(`   ❌ Errors: ${results.errors.length}`);

      if (results.errors.length > 0) {
        console.log('\n🚨 Migration Errors:');
        results.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }

      return results;
    } catch (error) {
      const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`💥 ${errorMsg}`);
      results.errors.push(errorMsg);
      return results;
    }
  }

  /**
   * Parses string-based objectives into structured format
   */
  private parseStringObjectives(
    objectivesString: string,
  ): OrganizationalObjective[] {
    const objectives: OrganizationalObjective[] = [];

    // Split by newlines and filter out empty lines
    const lines = objectivesString
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      try {
        const objective = this.parseObjectiveLine(line);
        if (objective) {
          objectives.push(objective);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to parse objective line: "${line}"`, error);
      }
    }

    return objectives;
  }

  /**
   * Parses a single objective line into structured format
   */
  private parseObjectiveLine(line: string): OrganizationalObjective | null {
    // Remove common prefixes like "1)", "•", "-", "*", etc.
    const cleanLine = line.replace(/^[\d]+[\.)]\s*|^[•\-\*]\s*|^[\s]*/, '').trim();

    if (cleanLine.length < 3) {
      return null; // Too short to be meaningful
    }

    // Extract title and description
    let title = cleanLine;
    let description = cleanLine;

    // If the line is very long, use first part as title and full as description
    if (cleanLine.length > 100) {
      // Try to find a natural break point (first sentence, comma, etc.)
      const breakPoints = ['. ', ': ', ' - ', ', '];
      let breakIndex = -1;

      for (const breakPoint of breakPoints) {
        const index = cleanLine.indexOf(breakPoint);
        if (index > 20 && index < 80) {
          // Good break point between 20-80 chars
          breakIndex = index;
          break;
        }
      }

      if (breakIndex > 0) {
        title = cleanLine.substring(0, breakIndex);
        description = cleanLine;
      } else {
        // Fallback: truncate title at 80 characters
        title = cleanLine.length > 80 ? cleanLine.substring(0, 77) + '...' : cleanLine;
        description = cleanLine;
      }
    }

    // Determine priority based on keywords
    const priority = this.inferPriority(cleanLine);

    // Set default status
    const status = ObjectiveStatus.PLANNING;

    // Generate target date (1 year from now by default)
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + 1);

    return {
      _id: new Types.ObjectId(),
      title: title.length > 200 ? title.substring(0, 197) + '...' : title,
      description: description.length > 1000 ? description.substring(0, 997) + '...' : description,
      priority,
      status,
      targetDate,
      progress: 0,
    };
  }

  /**
   * Infers priority based on objective content
   */
  private inferPriority(objective: string): ObjectivePriority {
    const lowercaseObj = objective.toLowerCase();

    // High priority keywords
    const highPriorityKeywords = [
      'critical', 'urgent', 'asap', 'priority', 'key', 'strategic',
      'revenue', 'profit', 'market share', 'competitive', 'launch',
    ];

    // Medium priority keywords
    const mediumPriorityKeywords = [
      'improve', 'enhance', 'develop', 'expand', 'grow', 'increase',
      'achieve', 'deliver', 'implement', 'optimize',
    ];

    // Low priority keywords
    const lowPriorityKeywords = [
      'maintain', 'support', 'monitor', 'review', 'explore',
      'consider', 'evaluate', 'research', 'investigate',
    ];

    // Check for critical/high priority indicators
    if (highPriorityKeywords.some((keyword) => lowercaseObj.includes(keyword))) {
      return ObjectivePriority.HIGH;
    }

    // Check for medium priority indicators
    if (mediumPriorityKeywords.some((keyword) => lowercaseObj.includes(keyword))) {
      return ObjectivePriority.MEDIUM;
    }

    // Check for low priority indicators
    if (lowPriorityKeywords.some((keyword) => lowercaseObj.includes(keyword))) {
      return ObjectivePriority.LOW;
    }

    // Default to medium priority
    return ObjectivePriority.MEDIUM;
  }

  /**
   * Rollback migration - converts structured objectives back to string format
   */
  async rollbackMigration(): Promise<{
    processed: number;
    rolledBack: number;
    errors: string[];
  }> {
    console.log('🔄 Starting rollback of organizational objectives migration...');

    const results = {
      processed: 0,
      rolledBack: 0,
      errors: [] as string[],
    };

    try {
      // Find organizations with structured objectives
      const organizations = await this.organizationModel.find({
        objectives: { $exists: true, $ne: null },
        'objectives.0': { $exists: true }, // Has at least one objective
      });

      console.log(`📊 Found ${organizations.length} organizations to rollback`);

      for (const org of organizations) {
        results.processed++;

        try {
          // Convert structured objectives back to string format
          const stringObjectives = org.objectives
            .map((obj, index) => `${index + 1}) ${obj.title}`)
            .join('\n');

          // Update the organization
          await this.organizationModel.updateOne(
            { _id: org._id },
            {
              $set: {
                organizationalObjectives: stringObjectives,
              },
              $unset: {
                objectives: 1,
              },
            },
          );

          console.log(`✅ Rolled back objectives for ${org.name}`);
          results.rolledBack++;
        } catch (error) {
          const errorMsg = `Failed to rollback ${org.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }

      console.log('\n📈 Rollback Summary:');
      console.log(`   📊 Total processed: ${results.processed}`);
      console.log(`   ✅ Successfully rolled back: ${results.rolledBack}`);
      console.log(`   ❌ Errors: ${results.errors.length}`);

      return results;
    } catch (error) {
      const errorMsg = `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`💥 ${errorMsg}`);
      results.errors.push(errorMsg);
      return results;
    }
  }

  /**
   * Preview migration without making changes
   */
  async previewMigration(): Promise<{
    organizationsToMigrate: number;
    sampleObjectives: Array<{
      organizationName: string;
      originalObjectives: string;
      parsedObjectives: OrganizationalObjective[];
    }>;
  }> {
    console.log('🔍 Previewing organizational objectives migration...');

    const organizations = await this.organizationModel.find({
      organizationalObjectives: { $exists: true, $ne: null },
      $and: [
        { organizationalObjectives: { $ne: '' } },
        {
          $or: [
            { objectives: { $exists: false } },
            { objectives: { $size: 0 } },
            { objectives: null },
          ],
        },
      ],
    }).limit(5);

    const sampleObjectives = organizations.map((org) => ({
      organizationName: org.name,
      originalObjectives: org.organizationalObjectives!,
      parsedObjectives: this.parseStringObjectives(org.organizationalObjectives!),
    }));

    const totalCount = await this.organizationModel.countDocuments({
      organizationalObjectives: { $exists: true, $ne: null },
      $and: [
        { organizationalObjectives: { $ne: '' } },
        {
          $or: [
            { objectives: { $exists: false } },
            { objectives: { $size: 0 } },
            { objectives: null },
          ],
        },
      ],
    });

    return {
      organizationsToMigrate: totalCount,
      sampleObjectives,
    };
  }
}