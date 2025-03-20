import { prisma } from '@/lib/db/prisma';

/**
 * Interface for health metric data
 */
export interface HealthMetric {
  name: string;
  value: number | string;
  unit?: string;
  normalRange?: {
    min?: number;
    max?: number;
  };
  timestamp: Date;
}

/**
 * Save a health report to the database
 */
export async function saveHealthReport(
  userId: string,
  reportId: string | undefined,
  name: string,
  date: Date,
  metrics: HealthMetric[],
  content: string
) {
  // Convert metrics to JSON string for storage
  const metricsJson = JSON.stringify(metrics);

  return await prisma.healthReport.upsert({
    where: {
      id: reportId || '',
    },
    update: {
      name,
      date,
      metrics: metricsJson,
      content,
      updatedAt: new Date(),
    },
    create: {
      name,
      date,
      metrics: metricsJson,
      content,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

/**
 * Get all health reports for a user
 */
export async function getUserHealthReports(userId: string) {
  return await prisma.healthReport.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: 'desc',
    },
  });
}

/**
 * Get a specific health report by ID
 */
export async function getHealthReportById(userId: string, reportId: string) {
  const report = await prisma.healthReport.findFirst({
    where: {
      id: reportId,
      userId,
    },
  });

  if (!report) return null;

  // Parse metrics from JSON string
  return {
    ...report,
    metrics: report.metrics ? JSON.parse(report.metrics) as HealthMetric[] : [],
  };
}

/**
 * Delete a health report
 */
export async function deleteHealthReport(userId: string, reportId: string) {
  return await prisma.healthReport.deleteMany({
    where: {
      id: reportId,
      userId,
    },
  });
}

/**
 * Extract metrics from raw health report text using AI
 * This is a placeholder for future implementation
 */
export async function extractMetricsFromReport(reportText: string): Promise<HealthMetric[]> {
  // This would be implemented with an AI model to extract structured data
  // For now, return a placeholder implementation
  
  const placeholderMetrics: HealthMetric[] = [
    {
      name: "Placeholder Metric",
      value: "0",
      unit: "units",
      normalRange: {
        min: 0,
        max: 0
      },
      timestamp: new Date()
    }
  ];
  
  return placeholderMetrics;
}

/**
 * Generate insights about health metrics over time
 * This is a placeholder for future implementation
 */
export async function generateHealthTrends(userId: string, metricNames: string[]) {
  // Get all reports for the user
  const reports = await getUserHealthReports(userId);
  
  // This would analyze the reports and generate trends
  // For now, return a placeholder
  
  return {
    trendsDetected: false,
    message: "Health trend analysis will be implemented in a future update."
  };
} 