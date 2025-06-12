import { Organization } from '@domain/organizations/entities/organization.entity';

export const ORGANIZATION_REPOSITORY = 'ORGANIZATION_REPOSITORY';

export interface IOrganizationRepository {
  create(organization: Partial<Organization>): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findByName(name: string): Promise<Organization | null>;
  findByCreatedBy(createdBy: string): Promise<Organization[]>;
  findAll(): Promise<Organization[]>;
  update(
    id: string,
    organization: Partial<Organization>,
  ): Promise<Organization | null>;
  delete(id: string): Promise<boolean>;
}
