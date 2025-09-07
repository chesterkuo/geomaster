import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsService, type AnalyticsParams, type SnapshotParams } from '@/lib/api/analytics';

// Query keys for React Query
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (websiteId: string) => [...analyticsKeys.all, 'dashboard', websiteId] as const,
  trends: (websiteId: string, params?: AnalyticsParams) => 
    [...analyticsKeys.all, 'trends', websiteId, params] as const,
  platforms: (websiteId: string, params?: AnalyticsParams) => 
    [...analyticsKeys.all, 'platforms', websiteId, params] as const,
  insights: (websiteId: string) => [...analyticsKeys.all, 'insights', websiteId] as const,
  snapshots: (websiteId: string, params?: any) => 
    [...analyticsKeys.all, 'snapshots', websiteId, params] as const,
  competitors: (websiteId: string) => [...analyticsKeys.all, 'competitors', websiteId] as const,
  competitorSummary: () => [...analyticsKeys.all, 'competitors', 'summary'] as const,
};

// Hook for dashboard data
export const useAnalyticsDashboard = (websiteId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(websiteId),
    queryFn: () => analyticsService.getDashboard(websiteId),
    enabled: enabled && !!websiteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 2,
  });
};

// Hook for analytics trends
export const useAnalyticsTrends = (
  websiteId: string, 
  params?: AnalyticsParams, 
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: analyticsKeys.trends(websiteId, params),
    queryFn: () => analyticsService.getTrends(websiteId, params),
    enabled: enabled && !!websiteId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
};

// Hook for platform performance
export const usePlatformPerformance = (
  websiteId: string, 
  params?: AnalyticsParams, 
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: analyticsKeys.platforms(websiteId, params),
    queryFn: () => analyticsService.getPlatformPerformance(websiteId, params),
    enabled: enabled && !!websiteId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
  });
};

// Hook for performance insights
export const usePerformanceInsights = (websiteId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: analyticsKeys.insights(websiteId),
    queryFn: () => analyticsService.getInsights(websiteId),
    enabled: enabled && !!websiteId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 15 * 60 * 1000,
    retry: 2,
  });
};

// Hook for historical snapshots
export const useAnalyticsSnapshots = (
  websiteId: string, 
  params?: { type?: 'daily' | 'weekly' | 'monthly'; limit?: number; offset?: number },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: analyticsKeys.snapshots(websiteId, params),
    queryFn: () => analyticsService.getSnapshots(websiteId, params),
    enabled: enabled && !!websiteId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
};

// Hook for competitor analysis
export const useCompetitorAnalysis = (websiteId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: analyticsKeys.competitors(websiteId),
    queryFn: () => analyticsService.analyzeCompetitors(websiteId),
    enabled: enabled && !!websiteId,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
};

// Hook for competitor summary
export const useCompetitorSummary = (enabled: boolean = true) => {
  return useQuery({
    queryKey: analyticsKeys.competitorSummary(),
    queryFn: () => analyticsService.getCompetitorSummary(),
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
};

// Mutation for generating snapshots
export const useGenerateSnapshot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: SnapshotParams) => analyticsService.generateSnapshot(params),
    onSuccess: (data, variables) => {
      // Invalidate snapshots queries to refetch new data
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.snapshots(variables.websiteId)
      });
      
      // Update dashboard data if it exists
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.dashboard(variables.websiteId)
      });
    },
  });
};

// Mutation for bulk snapshot generation (admin only)
export const useBulkGenerateSnapshots = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: { websiteIds: string[]; snapshotType: 'daily' | 'weekly' | 'monthly'; includeComparison: boolean }) => 
      analyticsService.bulkGenerateSnapshots(request),
    onSuccess: () => {
      // Invalidate all analytics queries
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.all
      });
    },
  });
};

// Combined hook for analytics overview
export const useAnalyticsOverview = (websiteId: string, period: '7d' | '30d' | '90d' | '1y' = '7d') => {
  const dashboardQuery = useAnalyticsDashboard(websiteId);
  const trendsQuery = useAnalyticsTrends(websiteId, { period });
  const platformsQuery = usePlatformPerformance(websiteId, { period });
  const insightsQuery = usePerformanceInsights(websiteId);
  
  const isLoading = dashboardQuery.isLoading || trendsQuery.isLoading || 
                   platformsQuery.isLoading || insightsQuery.isLoading;
  
  const isError = dashboardQuery.isError || trendsQuery.isError || 
                  platformsQuery.isError || insightsQuery.isError;
  
  const error = dashboardQuery.error || trendsQuery.error || 
                platformsQuery.error || insightsQuery.error;
  
  return {
    dashboard: dashboardQuery.data,
    trends: trendsQuery.data,
    platforms: platformsQuery.data,
    insights: insightsQuery.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      dashboardQuery.refetch();
      trendsQuery.refetch();
      platformsQuery.refetch();
      insightsQuery.refetch();
    }
  };
};

// Hook for real-time data with shorter intervals
export const useRealTimeAnalytics = (websiteId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...analyticsKeys.dashboard(websiteId), 'realtime'],
    queryFn: () => analyticsService.getDashboard(websiteId),
    enabled: enabled && !!websiteId,
    refetchInterval: 30 * 1000, // 30 seconds for real-time updates
    staleTime: 15 * 1000, // 15 seconds
    retry: 1,
  });
};