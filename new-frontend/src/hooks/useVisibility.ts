import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visibilityService, VisibilityFilters, VisibilityExportOptions } from '@/lib/api/visibility';

// Query keys for caching
const VISIBILITY_QUERY_KEYS = {
  all: ['visibility'] as const,
  trends: (filters: VisibilityFilters) => ['visibility', 'trends', filters] as const,
  mentions: (filters: VisibilityFilters) => ['visibility', 'mentions', filters] as const,
  platformPerformance: (filters: VisibilityFilters) => ['visibility', 'platform-performance', filters] as const,
  stats: (websiteId?: string) => ['visibility', 'stats', websiteId] as const,
  insights: (websiteId: string, period: string) => ['visibility', 'insights', websiteId, period] as const,
  history: (websiteId: string, timeRange: string) => ['visibility', 'history', websiteId, timeRange] as const,
  platformAnalytics: (platform: string, websiteId?: string, timeRange?: string) => ['visibility', 'platform-analytics', platform, websiteId, timeRange] as const,
  searchMentions: (query: string, filters: VisibilityFilters) => ['visibility', 'search-mentions', query, filters] as const,
};

// Hook for visibility trends data
export const useVisibilityTrends = (
  filters: VisibilityFilters = {},
  options: { enabled?: boolean; refetchInterval?: number; } = {}
) => {
  return useQuery({
    queryKey: VISIBILITY_QUERY_KEYS.trends(filters),
    queryFn: () => visibilityService.getVisibilityTrends(filters),
    enabled: options.enabled !== false && !!filters.websiteId, // Require websiteId
    refetchInterval: options.refetchInterval || 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for AI platform mentions
export const useVisibilityMentions = (
  filters: VisibilityFilters = {},
  options: { enabled?: boolean; refetchInterval?: number; } = {}
) => {
  return useQuery({
    queryKey: VISIBILITY_QUERY_KEYS.mentions(filters),
    queryFn: () => visibilityService.getMentions(filters),
    enabled: options.enabled !== false,
    refetchInterval: options.refetchInterval || 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for platform performance data
export const usePlatformPerformance = (
  filters: VisibilityFilters = {},
  options: { enabled?: boolean; refetchInterval?: number; } = {}
) => {
  return useQuery({
    queryKey: VISIBILITY_QUERY_KEYS.platformPerformance(filters),
    queryFn: () => visibilityService.getPlatformPerformance(filters),
    enabled: options.enabled !== false, // Don't require websiteId since we handle it internally
    refetchInterval: options.refetchInterval || 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for visibility statistics
export const useVisibilityStats = (
  websiteId?: string,
  options: { enabled?: boolean; refetchInterval?: number; } = {}
) => {
  return useQuery({
    queryKey: VISIBILITY_QUERY_KEYS.stats(websiteId),
    queryFn: () => visibilityService.getVisibilityStats(websiteId),
    enabled: options.enabled !== false,
    refetchInterval: options.refetchInterval || 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for visibility insights and recommendations
export const useVisibilityInsights = (
  websiteId: string,
  period: string = '30d',
  options: { enabled?: boolean; } = {}
) => {
  return useQuery({
    queryKey: VISIBILITY_QUERY_KEYS.insights(websiteId, period),
    queryFn: () => visibilityService.getVisibilityInsights(websiteId, period),
    enabled: options.enabled !== false && !!websiteId,
    staleTime: 10 * 60 * 1000, // 10 minutes - insights change less frequently
  });
};

// Hook for visibility history data
export const useVisibilityHistory = (
  websiteId: string,
  timeRange: '7d' | '30d' | '90d' | '12m' = '30d',
  options: { enabled?: boolean; } = {}
) => {
  return useQuery({
    queryKey: VISIBILITY_QUERY_KEYS.history(websiteId, timeRange),
    queryFn: () => visibilityService.getVisibilityHistory(websiteId, timeRange),
    enabled: options.enabled !== false && !!websiteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for platform-specific analytics
export const usePlatformAnalytics = (
  platform: string,
  websiteId?: string,
  timeRange: string = '30d',
  options: { enabled?: boolean; } = {}
) => {
  return useQuery({
    queryKey: VISIBILITY_QUERY_KEYS.platformAnalytics(platform, websiteId, timeRange),
    queryFn: () => visibilityService.getPlatformAnalytics(platform, websiteId, timeRange),
    enabled: options.enabled !== false && !!platform,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for searching mentions by keyword
export const useSearchMentions = (
  query: string,
  filters: VisibilityFilters = {},
  options: { enabled?: boolean; } = {}
) => {
  return useQuery({
    queryKey: VISIBILITY_QUERY_KEYS.searchMentions(query, filters),
    queryFn: () => visibilityService.searchMentions(query, filters),
    enabled: options.enabled !== false && query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hook for exporting visibility data
export const useExportVisibilityData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: VisibilityExportOptions) => visibilityService.exportVisibilityData(options),
    onSuccess: () => {
      // Could trigger a toast notification or handle the download
    },
  });
};

// Hook to refresh all visibility data
export const useRefreshVisibilityData = () => {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    return queryClient.invalidateQueries({ queryKey: VISIBILITY_QUERY_KEYS.all });
  };

  const refreshTrends = (filters?: VisibilityFilters) => {
    if (filters) {
      return queryClient.invalidateQueries({ queryKey: VISIBILITY_QUERY_KEYS.trends(filters) });
    }
    return queryClient.invalidateQueries({ queryKey: ['visibility', 'trends'] });
  };

  const refreshMentions = (filters?: VisibilityFilters) => {
    if (filters) {
      return queryClient.invalidateQueries({ queryKey: VISIBILITY_QUERY_KEYS.mentions(filters) });
    }
    return queryClient.invalidateQueries({ queryKey: ['visibility', 'mentions'] });
  };

  const refreshStats = (websiteId?: string) => {
    return queryClient.invalidateQueries({ queryKey: VISIBILITY_QUERY_KEYS.stats(websiteId) });
  };

  return {
    refreshAll,
    refreshTrends,
    refreshMentions,
    refreshStats,
  };
};

// Prefetch hook for better UX
export const usePrefetchVisibilityData = () => {
  const queryClient = useQueryClient();

  const prefetchTrends = (filters: VisibilityFilters = {}) => {
    return queryClient.prefetchQuery({
      queryKey: VISIBILITY_QUERY_KEYS.trends(filters),
      queryFn: () => visibilityService.getVisibilityTrends(filters),
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchMentions = (filters: VisibilityFilters = {}) => {
    return queryClient.prefetchQuery({
      queryKey: VISIBILITY_QUERY_KEYS.mentions(filters),
      queryFn: () => visibilityService.getMentions(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchStats = (websiteId?: string) => {
    return queryClient.prefetchQuery({
      queryKey: VISIBILITY_QUERY_KEYS.stats(websiteId),
      queryFn: () => visibilityService.getVisibilityStats(websiteId),
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    prefetchTrends,
    prefetchMentions,
    prefetchStats,
  };
};