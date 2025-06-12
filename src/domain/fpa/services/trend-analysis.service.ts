import { Injectable } from '@nestjs/common';
import { Estimate } from '@domain/fpa/entities/estimate.entity';

export interface TrendPoint {
  date: Date;
  value: number;
}

export interface TrendAnalysisResult {
  data: TrendPoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
  forecastedValue: number;
  confidenceLevel: number;
}

export enum TrendMetric {
  UNADJUSTED_FP = 'unadjustedFunctionPoints',
  ADJUSTED_FP = 'adjustedFunctionPoints',
  EFFORT = 'estimatedEffortHours',
  VAF = 'valueAdjustmentFactor',
}

@Injectable()
export class TrendAnalysisService {
  analyzeTrend(
    estimates: Estimate[],
    metric: TrendMetric,
    forecastPeriods = 1,
  ): TrendAnalysisResult {
    if (!estimates || estimates.length < 2) {
      throw new Error('At least two estimates are required for trend analysis');
    }

    // Sort estimates by creation date
    const sortedEstimates = [...estimates].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    // Extract data points for the selected metric
    const data: TrendPoint[] = sortedEstimates.map((estimate) => ({
      date: estimate.createdAt,
      value: estimate[metric],
    }));

    // Calculate statistics
    const values = data.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const averageValue =
      values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate linear regression for forecasting
    const { slope, intercept, rSquared } = this.calculateLinearRegression(data);

    // Determine trend direction
    const trend =
      slope > 0.05 ? 'increasing' : slope < -0.05 ? 'decreasing' : 'stable';

    // Calculate percentage change
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const percentageChange = ((lastValue - firstValue) / firstValue) * 100;

    // Calculate forecasted value using linear regression
    const lastDate = data[data.length - 1].date;
    const timeDiff = lastDate.getTime() - data[0].date.getTime();
    const timePerPeriod = timeDiff / (data.length - 1);
    const forecastDate = new Date(
      lastDate.getTime() + timePerPeriod * forecastPeriods,
    );
    const daysFromStart =
      (forecastDate.getTime() - data[0].date.getTime()) / (1000 * 60 * 60 * 24);
    const forecastedValue = slope * daysFromStart + intercept;

    // Confidence level based on R-squared value (correlation coefficient)
    const confidenceLevel = rSquared * 100;

    return {
      data,
      trend,
      percentageChange,
      averageValue,
      minValue,
      maxValue,
      forecastedValue,
      confidenceLevel,
    };
  }

  private calculateLinearRegression(data: TrendPoint[]): {
    slope: number;
    intercept: number;
    rSquared: number;
  } {
    const n = data.length;
    const startDate = data[0].date.getTime();

    // Convert dates to days from start
    const xValues = data.map(
      (point) => (point.date.getTime() - startDate) / (1000 * 60 * 60 * 24),
    );
    const yValues = data.map((point) => point.value);

    // Calculate means
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / n;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += (xValues[i] - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R-squared (coefficient of determination)
    let totalSumOfSquares = 0;
    let residualSumOfSquares = 0;

    for (let i = 0; i < n; i++) {
      const predictedY = slope * xValues[i] + intercept;
      totalSumOfSquares += (yValues[i] - yMean) ** 2;
      residualSumOfSquares += (yValues[i] - predictedY) ** 2;
    }

    const rSquared =
      totalSumOfSquares !== 0
        ? 1 - residualSumOfSquares / totalSumOfSquares
        : 0;

    return { slope, intercept, rSquared };
  }

  forecastValues(
    estimates: Estimate[],
    metric: TrendMetric,
    periods: number,
  ): { date: Date; value: number }[] {
    if (!estimates || estimates.length < 2) {
      throw new Error('At least two estimates are required for forecasting');
    }

    // Sort estimates by creation date
    const sortedEstimates = [...estimates].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    // Extract data points for the selected metric
    const data: TrendPoint[] = sortedEstimates.map((estimate) => ({
      date: estimate.createdAt,
      value: estimate[metric],
    }));

    // Calculate linear regression
    const { slope, intercept } = this.calculateLinearRegression(data);

    // Calculate time interval
    const lastDate = data[data.length - 1].date;
    const timeDiff = lastDate.getTime() - data[0].date.getTime();
    const timePerPeriod = timeDiff / (data.length - 1);

    // Generate forecast
    const forecast: { date: Date; value: number }[] = [];
    const startDate = data[0].date.getTime();

    for (let i = 1; i <= periods; i++) {
      const forecastDate = new Date(lastDate.getTime() + timePerPeriod * i);
      const daysFromStart =
        (forecastDate.getTime() - startDate) / (1000 * 60 * 60 * 24);
      const forecastedValue = slope * daysFromStart + intercept;

      forecast.push({
        date: forecastDate,
        value: Math.max(0, forecastedValue), // Ensure no negative values
      });
    }

    return forecast;
  }

  detectAnomalies(
    estimates: Estimate[],
    metric: TrendMetric,
    threshold = 2,
  ): Estimate[] {
    if (!estimates || estimates.length < 4) {
      return []; // Need enough data to detect anomalies
    }

    // Sort estimates by creation date
    const sortedEstimates = [...estimates].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    // Extract values for the selected metric
    const values = sortedEstimates.map((estimate) => estimate[metric]);

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map((val) => (val - mean) ** 2);
    const variance =
      squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect anomalies (values that are more than 'threshold' standard deviations from the mean)
    const anomalies: Estimate[] = [];
    for (let i = 0; i < sortedEstimates.length; i++) {
      const zScore = Math.abs(values[i] - mean) / stdDev;
      if (zScore > threshold) {
        anomalies.push(sortedEstimates[i]);
      }
    }

    return anomalies;
  }
}
