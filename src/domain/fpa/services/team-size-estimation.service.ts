import { Injectable } from '@nestjs/common';

export interface TeamSizeEstimationParams {
  adjustedFunctionPoints: number;
  productivityFactor: number; // Hours per function point
  hoursPerDayPerPerson: number; // Typically 6-8 productive hours
  projectDurationMonths?: number; // If duration is fixed
  teamSize?: number; // If team size is fixed
  bufferPercentage?: number; // For uncertainty, typically 10-30%
}

export interface TeamSizeEstimationResult {
  totalEffortHours: number;
  totalEffortDays: number;
  totalEffortMonths: number;
  recommendedTeamSize: number;
  recommendedDurationMonths: number;
  minTeamSize: number;
  maxTeamSize: number;
  minDurationMonths: number;
  maxDurationMonths: number;
  bufferHours: number;
  workingDaysPerMonth: number;
}

@Injectable()
export class TeamSizeEstimationService {
  // Standard working days per month (excluding weekends and holidays)
  private readonly WORKING_DAYS_PER_MONTH = 21;

  estimateTeamSize(params: TeamSizeEstimationParams): TeamSizeEstimationResult {
    const {
      adjustedFunctionPoints,
      productivityFactor,
      hoursPerDayPerPerson,
      projectDurationMonths,
      teamSize,
      bufferPercentage = 20, // Default buffer 20%
    } = params;

    // Calculate total effort
    const baseEffortHours = adjustedFunctionPoints * productivityFactor;
    const bufferHours = (baseEffortHours * bufferPercentage) / 100;
    const totalEffortHours = baseEffortHours + bufferHours;
    const totalEffortDays = totalEffortHours / hoursPerDayPerPerson;
    const totalEffortMonths = totalEffortDays / this.WORKING_DAYS_PER_MONTH;

    let recommendedTeamSize: number;
    let recommendedDurationMonths: number;

    // Fixed duration scenario
    if (projectDurationMonths && !teamSize) {
      recommendedTeamSize = this.calculateTeamSizeForDuration(
        totalEffortHours,
        projectDurationMonths,
        hoursPerDayPerPerson,
      );
      recommendedDurationMonths = projectDurationMonths;
    }
    // Fixed team size scenario
    else if (teamSize && !projectDurationMonths) {
      recommendedTeamSize = teamSize;
      recommendedDurationMonths = this.calculateDurationForTeamSize(
        totalEffortHours,
        teamSize,
        hoursPerDayPerPerson,
      );
    }
    // Balanced approach scenario (optimize both)
    else {
      // Estimate optimal duration based on project size
      const optimalDuration = this.estimateOptimalDuration(
        adjustedFunctionPoints,
      );
      recommendedDurationMonths = optimalDuration;
      recommendedTeamSize = this.calculateTeamSizeForDuration(
        totalEffortHours,
        optimalDuration,
        hoursPerDayPerPerson,
      );
    }

    // Create minimum and maximum ranges
    const minTeamSize = Math.max(1, Math.floor(recommendedTeamSize * 0.8));
    const maxTeamSize = Math.ceil(recommendedTeamSize * 1.2);

    const minDurationMonths = this.calculateDurationForTeamSize(
      totalEffortHours,
      maxTeamSize,
      hoursPerDayPerPerson,
    );
    const maxDurationMonths = this.calculateDurationForTeamSize(
      totalEffortHours,
      minTeamSize,
      hoursPerDayPerPerson,
    );

    return {
      totalEffortHours,
      totalEffortDays,
      totalEffortMonths,
      recommendedTeamSize: Math.max(1, Math.round(recommendedTeamSize)),
      recommendedDurationMonths,
      minTeamSize,
      maxTeamSize,
      minDurationMonths,
      maxDurationMonths,
      bufferHours,
      workingDaysPerMonth: this.WORKING_DAYS_PER_MONTH,
    };
  }

  // Calculate team size needed for a fixed duration
  private calculateTeamSizeForDuration(
    totalEffortHours: number,
    durationMonths: number,
    hoursPerDayPerPerson: number,
  ): number {
    const workingDays = durationMonths * this.WORKING_DAYS_PER_MONTH;
    const availableHoursPerPerson = workingDays * hoursPerDayPerPerson;
    return totalEffortHours / availableHoursPerPerson;
  }

  // Calculate duration needed for a fixed team size
  private calculateDurationForTeamSize(
    totalEffortHours: number,
    teamSize: number,
    hoursPerDayPerPerson: number,
  ): number {
    const totalAvailableHoursPerDay = teamSize * hoursPerDayPerPerson;
    const totalDaysNeeded = totalEffortHours / totalAvailableHoursPerDay;
    return totalDaysNeeded / this.WORKING_DAYS_PER_MONTH;
  }

  // Estimate optimal duration based on project size (function points)
  private estimateOptimalDuration(functionPoints: number): number {
    // These are empirical guidelines based on industry practices
    if (functionPoints < 100) {
      return 1.5; // Small project: 1-2 months
    } else if (functionPoints < 300) {
      return 3; // Medium project: 2-4 months
    } else if (functionPoints < 750) {
      return 6; // Large project: 4-8 months
    } else if (functionPoints < 1500) {
      return 9; // Very large project: 6-12 months
    } else {
      return 12 + (functionPoints - 1500) / 500; // Enterprise projects: 12+ months
    }
  }

  // Calculate ideal team size based on project complexity (function points)
  estimateIdealTeamSize(functionPoints: number): { min: number; max: number } {
    // Team size guidelines based on project size
    if (functionPoints < 100) {
      return { min: 1, max: 3 }; // Small project
    } else if (functionPoints < 300) {
      return { min: 2, max: 5 }; // Medium project
    } else if (functionPoints < 750) {
      return { min: 4, max: 8 }; // Large project
    } else if (functionPoints < 1500) {
      return { min: 6, max: 12 }; // Very large project
    } else {
      return { min: 10, max: 20 }; // Enterprise projects
    }
  }

  // Calculate duration in months with additional parameters
  calculateDuration(
    adjustedFunctionPoints: number,
    teamSize: number,
    productivityFactor: number,
    hoursPerDay: number,
    bufferPercentage: number = 20,
  ): number {
    const baseEffortHours = adjustedFunctionPoints * productivityFactor;
    const totalEffortHours = baseEffortHours * (1 + bufferPercentage / 100);
    const totalAvailableHoursPerDay = teamSize * hoursPerDay;
    const totalDaysNeeded = totalEffortHours / totalAvailableHoursPerDay;
    return totalDaysNeeded / this.WORKING_DAYS_PER_MONTH;
  }
}
