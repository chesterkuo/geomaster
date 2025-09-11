import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { competitorsService, CompetitorFilters, Competitor } from '@/lib/api/competitors';
import { toast } from 'sonner';

// Query keys for caching
const COMPETITORS_QUERY_KEYS = {
  all: ['competitors'] as const,
  list: (filters: CompetitorFilters) => ['competitors', 'list', filters] as const,
  analysis: (websiteId: string, timeRange: string) => ['competitors', 'analysis', websiteId, timeRange] as const,
  summary: (filters: CompetitorFilters) => ['competitors', 'summary', filters] as const,
  benchmarks: (websiteId: string, competitorIds: string[]) => ['competitors', 'benchmarks', websiteId, competitorIds] as const,
  keywordOpportunities: (websiteId: string, competitorIds?: string[]) => ['competitors', 'keyword-opportunities', websiteId, competitorIds] as const,
  history: (competitorId: string, timeRange: string) => ['competitors', 'history', competitorId, timeRange] as const,
  alerts: (websiteId: string, filters: any) => ['competitors', 'alerts', websiteId, filters] as const,
};

// Hook for competitors list
export const useCompetitors = (
  filters: CompetitorFilters = {},
  options: { enabled?: boolean; refetchInterval?: number; } = {}
) => {
  return useQuery({
    queryKey: COMPETITORS_QUERY_KEYS.list(filters),
    queryFn: () => competitorsService.getCompetitors(filters),
    enabled: options.enabled !== false,
    refetchInterval: options.refetchInterval || 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for competitive analysis data
export const useCompetitiveAnalysis = (
  websiteId: string,
  timeRange: string = '30d',
  options: { enabled?: boolean; refetchInterval?: number; } = {}
) => {
  return useQuery({
    queryKey: COMPETITORS_QUERY_KEYS.analysis(websiteId, timeRange),
    queryFn: () => competitorsService.getCompetitiveAnalysis(websiteId, timeRange),
    enabled: options.enabled !== false && !!websiteId,
    refetchInterval: options.refetchInterval || 15 * 60 * 1000, // 15 minutes
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for competitor summary
export const useCompetitorSummary = (
  filters: CompetitorFilters = {},
  options: { enabled?: boolean; refetchInterval?: number; } = {}
) => {
  return useQuery({
    queryKey: COMPETITORS_QUERY_KEYS.summary(filters),
    queryFn: () => competitorsService.getCompetitorSummary(filters),
    enabled: options.enabled !== false,
    refetchInterval: options.refetchInterval || 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for competitor benchmarks
export const useCompetitorBenchmarks = (
  websiteId: string,
  competitorIds: string[],
  options: { enabled?: boolean; } = {}
) => {
  return useQuery({
    queryKey: COMPETITORS_QUERY_KEYS.benchmarks(websiteId, competitorIds),
    queryFn: () => competitorsService.getCompetitorBenchmarks(websiteId, competitorIds),
    enabled: options.enabled !== false && !!websiteId && competitorIds.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes - benchmarks change less frequently
  });
};

// Hook for keyword opportunities
export const useKeywordOpportunities = (
  websiteId: string,
  competitorIds?: string[],
  options: { enabled?: boolean; } = {}
) => {
  return useQuery({
    queryKey: COMPETITORS_QUERY_KEYS.keywordOpportunities(websiteId, competitorIds),
    queryFn: () => competitorsService.getKeywordOpportunities(websiteId, competitorIds),
    enabled: options.enabled !== false && !!websiteId,
    staleTime: 30 * 60 * 1000, // 30 minutes - opportunities change less frequently
  });
};

// Hook for competitor history
export const useCompetitorHistory = (
  competitorId: string,
  timeRange: string = '90d',
  options: { enabled?: boolean; } = {}
) => {
  return useQuery({
    queryKey: COMPETITORS_QUERY_KEYS.history(competitorId, timeRange),
    queryFn: () => competitorsService.getCompetitorHistory(competitorId, timeRange),
    enabled: options.enabled !== false && !!competitorId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook for competitive alerts
export const useCompetitiveAlerts = (
  websiteId: string,
  filters: { type?: string[]; severity?: 'high' | 'medium' | 'low'; limit?: number; page?: number; } = {},
  options: { enabled?: boolean; refetchInterval?: number; } = {}
) => {
  return useQuery({
    queryKey: COMPETITORS_QUERY_KEYS.alerts(websiteId, filters),
    queryFn: () => competitorsService.getCompetitiveAlerts(websiteId, filters),
    enabled: options.enabled !== false && !!websiteId,
    refetchInterval: options.refetchInterval || 5 * 60 * 1000, // 5 minutes - alerts need frequent updates
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutation hook for adding a competitor
export const useAddCompetitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (competitor: { name: string; websiteUrl: string; domain?: string; }) => 
      competitorsService.addCompetitor(competitor),
    onSuccess: (data) => {
      // Invalidate and refetch competitors list
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      toast.success(`Successfully added competitor: ${data.data.name}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add competitor');
    },
  });
};

// Mutation hook for removing a competitor
export const useRemoveCompetitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (competitorId: string) => competitorsService.removeCompetitor(competitorId),
    onSuccess: () => {
      // Invalidate and refetch competitors list
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      toast.success('Competitor removed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to remove competitor');
    },
  });
};

// Mutation hook for updating a competitor
export const useUpdateCompetitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ competitorId, updates }: { 
      competitorId: string; 
      updates: Partial<Pick<Competitor, 'name' | 'isActive'>>; 
    }) => competitorsService.updateCompetitor(competitorId, updates),
    onSuccess: (data) => {
      // Invalidate and refetch competitors list
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
      toast.success(`Successfully updated competitor: ${data.data.name}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update competitor');
    },
  });
};

// Mutation hook for analyzing competitors
export const useAnalyzeCompetitors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ websiteId, competitorIds }: { websiteId: string; competitorIds?: string[]; }) => 
      competitorsService.analyzeCompetitors(websiteId, competitorIds),
    onSuccess: (data) => {
      // Invalidate competitive analysis data
      queryClient.invalidateQueries({ queryKey: ['competitors', 'analysis'] });
      queryClient.invalidateQueries({ queryKey: ['competitors', 'benchmarks'] });
      
      if (data.data.status === 'started') {
        toast.success('Competitor analysis started. This may take a few minutes.');
      } else {
        toast.success('Competitor analysis completed successfully');
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to start competitor analysis');
    },
  });
};

// Mutation hook for exporting competitive analysis
export const useExportCompetitiveAnalysis = () => {
  return useMutation({
    mutationFn: (options: {
      websiteId: string;
      competitorIds?: string[];
      format: 'csv' | 'xlsx' | 'pdf';
      timeRange: string;
      sections: Array<'overview' | 'benchmarks' | 'gaps' | 'opportunities' | 'trends'>;
    }) => competitorsService.exportCompetitiveAnalysis(options),
    onSuccess: (data) => {
      // Handle download or show success message
      toast.success('Competitive analysis report generated successfully');
      // Could trigger download here
      if (data.data.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to generate report');
    },
  });
};

// Hook to refresh all competitor data
export const useRefreshCompetitorData = () => {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    return queryClient.invalidateQueries({ queryKey: COMPETITORS_QUERY_KEYS.all });
  };

  const refreshList = (filters?: CompetitorFilters) => {
    if (filters) {
      return queryClient.invalidateQueries({ queryKey: COMPETITORS_QUERY_KEYS.list(filters) });
    }
    return queryClient.invalidateQueries({ queryKey: ['competitors', 'list'] });
  };

  const refreshAnalysis = (websiteId: string, timeRange?: string) => {
    if (timeRange) {
      return queryClient.invalidateQueries({ 
        queryKey: COMPETITORS_QUERY_KEYS.analysis(websiteId, timeRange) 
      });
    }
    return queryClient.invalidateQueries({ queryKey: ['competitors', 'analysis', websiteId] });
  };

  const refreshSummary = (filters?: CompetitorFilters) => {
    if (filters) {
      return queryClient.invalidateQueries({ queryKey: COMPETITORS_QUERY_KEYS.summary(filters) });
    }
    return queryClient.invalidateQueries({ queryKey: ['competitors', 'summary'] });
  };

  return {
    refreshAll,
    refreshList,
    refreshAnalysis,
    refreshSummary,
  };
};

// Prefetch hook for better UX
export const usePrefetchCompetitorData = () => {
  const queryClient = useQueryClient();

  const prefetchList = (filters: CompetitorFilters = {}) => {
    return queryClient.prefetchQuery({
      queryKey: COMPETITORS_QUERY_KEYS.list(filters),
      queryFn: () => competitorsService.getCompetitors(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchAnalysis = (websiteId: string, timeRange: string = '30d') => {
    return queryClient.prefetchQuery({
      queryKey: COMPETITORS_QUERY_KEYS.analysis(websiteId, timeRange),
      queryFn: () => competitorsService.getCompetitiveAnalysis(websiteId, timeRange),
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchSummary = (filters: CompetitorFilters = {}) => {
    return queryClient.prefetchQuery({
      queryKey: COMPETITORS_QUERY_KEYS.summary(filters),
      queryFn: () => competitorsService.getCompetitorSummary(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchList,
    prefetchAnalysis,
    prefetchSummary,
  };
};