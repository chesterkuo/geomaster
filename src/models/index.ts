import sequelize from '../config/database';
import User from './User';
import Organization from './Organization';
import UserOrganization from './UserOrganization';
import Website from './Website';
import Scan from './Scan';
import Content from './Content';
import AITrackingResult from './AITrackingResult';
import { Page } from './Page';
import Keyword from './Keyword';
import Competitor from './Competitor';
import TrackingSettings from './TrackingSettings';
import PlatformSettings from './PlatformSettings';
import AlertConfiguration from './AlertConfiguration';
import AlertHistory from './AlertHistory';
import MetricsSnapshot from './MetricsSnapshot';
import AnalyticsSnapshot from './AnalyticsSnapshot';
import CompetitorBenchmark from './CompetitorBenchmark';
import KeywordResearch from './KeywordResearch';
import KeywordRanking from './KeywordRanking';
import ReportTemplate from './ReportTemplate';
import GeneratedReport from './GeneratedReport';
import ScheduledReport from './ScheduledReport';
import { MLModel } from './MLModel';
import { MLOptimizationSuggestion } from './MLOptimizationSuggestion';
import { ThirdPartyIntegration } from './ThirdPartyIntegration';
import { Webhook } from './Webhook';
import { AutomationWorkflow } from './AutomationWorkflow';
import { ABExperiment } from './ABExperiment';
import { ABVariant } from './ABVariant';
import { ABUserSegment } from './ABUserSegment';

// Initialize Phase 3 models
import { initMLModel } from './MLModel';
import { initMLOptimizationSuggestion } from './MLOptimizationSuggestion';
import { initThirdPartyIntegration } from './ThirdPartyIntegration';
import { initWebhook } from './Webhook';
import { initAutomationWorkflow } from './AutomationWorkflow';
import { initABExperiment } from './ABExperiment';
import { initABVariant } from './ABVariant';
import { initABUserSegment } from './ABUserSegment';

// Initialize all Phase 3 models
initMLModel(sequelize);
initMLOptimizationSuggestion(sequelize);
initThirdPartyIntegration(sequelize);
initWebhook(sequelize);
initAutomationWorkflow(sequelize);
initABExperiment(sequelize);
initABVariant(sequelize);
initABUserSegment(sequelize);

// Define associations
// User-Organization many-to-many relationship
User.belongsToMany(Organization, {
  through: UserOrganization,
  foreignKey: 'userId',
  otherKey: 'organizationId',
  as: 'organizations'
});

Organization.belongsToMany(User, {
  through: UserOrganization,
  foreignKey: 'organizationId',
  otherKey: 'userId',
  as: 'users'
});

// Direct associations with the junction table
User.hasMany(UserOrganization, {
  foreignKey: 'userId',
  as: 'userOrganizations'
});

Organization.hasMany(UserOrganization, {
  foreignKey: 'organizationId',
  as: 'organizationUsers'
});

UserOrganization.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

UserOrganization.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Organization-Website one-to-many relationship
Organization.hasMany(Website, {
  foreignKey: 'organizationId',
  as: 'websites'
});

Website.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Website-Scan one-to-many relationship
Website.hasMany(Scan, {
  foreignKey: 'website_id',
  as: 'scans'
});

Scan.belongsTo(Website, {
  foreignKey: 'website_id',
  as: 'website'
});

// Website-Content one-to-many relationship
Website.hasMany(Content, {
  foreignKey: 'website_id',
  as: 'contents'
});

Content.belongsTo(Website, {
  foreignKey: 'website_id',
  as: 'website'
});

// Website-AITrackingResult one-to-many relationship
Website.hasMany(AITrackingResult, {
  foreignKey: 'website_id',
  as: 'trackingResults'
});

AITrackingResult.belongsTo(Website, {
  foreignKey: 'website_id',
  as: 'website'
});

// Organization-Page one-to-many relationship
Organization.hasMany(Page, {
  foreignKey: 'organizationId',
  as: 'pages'
});

Page.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Organization-Keyword one-to-many relationship
Organization.hasMany(Keyword, {
  foreignKey: 'organizationId',
  as: 'keywords'
});

Keyword.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Organization-Competitor one-to-many relationship
Organization.hasMany(Competitor, {
  foreignKey: 'organization_id',
  as: 'competitors'
});

Competitor.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Organization-TrackingSettings one-to-one relationship
Organization.hasOne(TrackingSettings, {
  foreignKey: 'organizationId',
  as: 'trackingSettings'
});

TrackingSettings.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Organization-PlatformSettings one-to-many relationship
Organization.hasMany(PlatformSettings, {
  foreignKey: 'organizationId',
  as: 'platformSettings'
});

PlatformSettings.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Organization-AlertConfiguration one-to-many relationship
Organization.hasMany(AlertConfiguration, {
  foreignKey: 'organizationId',
  as: 'alertConfigurations'
});

AlertConfiguration.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Website-AlertConfiguration one-to-many relationship (optional)
Website.hasMany(AlertConfiguration, {
  foreignKey: 'websiteId',
  as: 'alertConfigurations'
});

AlertConfiguration.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website'
});

// AlertConfiguration-AlertHistory one-to-many relationship
AlertConfiguration.hasMany(AlertHistory, {
  foreignKey: 'alertConfigId',
  as: 'alertHistory'
});

AlertHistory.belongsTo(AlertConfiguration, {
  foreignKey: 'alertConfigId',
  as: 'alertConfiguration'
});

// Organization-AlertHistory one-to-many relationship
Organization.hasMany(AlertHistory, {
  foreignKey: 'organizationId',
  as: 'alertHistory'
});

AlertHistory.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Website-AlertHistory one-to-many relationship (optional)
Website.hasMany(AlertHistory, {
  foreignKey: 'websiteId',
  as: 'alertHistory'
});

AlertHistory.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website'
});

// Organization-MetricsSnapshot one-to-many relationship
Organization.hasMany(MetricsSnapshot, {
  foreignKey: 'organizationId',
  as: 'metricsSnapshots'
});

MetricsSnapshot.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Website-MetricsSnapshot one-to-many relationship
Website.hasMany(MetricsSnapshot, {
  foreignKey: 'websiteId',
  as: 'metricsSnapshots'
});

MetricsSnapshot.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website'
});

// Organization-AnalyticsSnapshot one-to-many relationship
Organization.hasMany(AnalyticsSnapshot, {
  foreignKey: 'organizationId',
  as: 'analyticsSnapshots'
});

AnalyticsSnapshot.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Website-AnalyticsSnapshot one-to-many relationship
Website.hasMany(AnalyticsSnapshot, {
  foreignKey: 'websiteId',
  as: 'analyticsSnapshots'
});

AnalyticsSnapshot.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website'
});

// Organization-CompetitorBenchmark one-to-many relationship
Organization.hasMany(CompetitorBenchmark, {
  foreignKey: 'organizationId',
  as: 'competitorBenchmarks'
});

CompetitorBenchmark.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Website-CompetitorBenchmark one-to-many relationship
Website.hasMany(CompetitorBenchmark, {
  foreignKey: 'websiteId',
  as: 'competitorBenchmarks'
});

CompetitorBenchmark.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website'
});

// Competitor-CompetitorBenchmark one-to-many relationship
Competitor.hasMany(CompetitorBenchmark, {
  foreignKey: 'competitorId',
  as: 'benchmarks'
});

CompetitorBenchmark.belongsTo(Competitor, {
  foreignKey: 'competitorId',
  as: 'competitor'
});

// Organization-KeywordResearch one-to-many relationship
Organization.hasMany(KeywordResearch, {
  foreignKey: 'organizationId',
  as: 'keywordResearch'
});

KeywordResearch.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// KeywordResearch-KeywordRanking one-to-many relationship
KeywordResearch.hasMany(KeywordRanking, {
  foreignKey: 'keywordId',
  as: 'rankings'
});

KeywordRanking.belongsTo(KeywordResearch, {
  foreignKey: 'keywordId',
  as: 'keyword'
});

// Organization-KeywordRanking one-to-many relationship
Organization.hasMany(KeywordRanking, {
  foreignKey: 'organizationId',
  as: 'keywordRankings'
});

KeywordRanking.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Website-KeywordRanking one-to-many relationship
Website.hasMany(KeywordRanking, {
  foreignKey: 'websiteId',
  as: 'keywordRankings'
});

KeywordRanking.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website'
});

// Organization-ReportTemplate one-to-many relationship
Organization.hasMany(ReportTemplate, {
  foreignKey: 'organizationId',
  as: 'reportTemplates'
});

ReportTemplate.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// User-ReportTemplate one-to-many relationship (creator)
User.hasMany(ReportTemplate, {
  foreignKey: 'createdBy',
  as: 'createdTemplates'
});

ReportTemplate.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// Organization-GeneratedReport one-to-many relationship
Organization.hasMany(GeneratedReport, {
  foreignKey: 'organizationId',
  as: 'generatedReports'
});

GeneratedReport.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// ReportTemplate-GeneratedReport one-to-many relationship
ReportTemplate.hasMany(GeneratedReport, {
  foreignKey: 'templateId',
  as: 'generatedReports'
});

GeneratedReport.belongsTo(ReportTemplate, {
  foreignKey: 'templateId',
  as: 'template'
});

// User-GeneratedReport one-to-many relationship (generator)
User.hasMany(GeneratedReport, {
  foreignKey: 'generatedBy',
  as: 'generatedReports'
});

GeneratedReport.belongsTo(User, {
  foreignKey: 'generatedBy',
  as: 'generator'
});

// Organization-ScheduledReport one-to-many relationship
Organization.hasMany(ScheduledReport, {
  foreignKey: 'organizationId',
  as: 'scheduledReports'
});

ScheduledReport.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// ReportTemplate-ScheduledReport one-to-many relationship
ReportTemplate.hasMany(ScheduledReport, {
  foreignKey: 'templateId',
  as: 'scheduledReports'
});

ScheduledReport.belongsTo(ReportTemplate, {
  foreignKey: 'templateId',
  as: 'template'
});

// User-ScheduledReport one-to-many relationship (creator)
User.hasMany(ScheduledReport, {
  foreignKey: 'createdBy',
  as: 'scheduledReports'
});

ScheduledReport.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// Phase 3 Model Associations

// ML Model Associations
MLOptimizationSuggestion.belongsTo(MLModel, {
  foreignKey: 'modelId',
  as: 'model'
});

MLModel.hasMany(MLOptimizationSuggestion, {
  foreignKey: 'modelId',
  as: 'suggestions'
});

MLOptimizationSuggestion.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

MLOptimizationSuggestion.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website'
});

// Integration Associations
ThirdPartyIntegration.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

Organization.hasMany(ThirdPartyIntegration, {
  foreignKey: 'organizationId',
  as: 'integrations'
});

// Webhook Associations
Webhook.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

Organization.hasMany(Webhook, {
  foreignKey: 'organizationId',
  as: 'webhooks'
});

// Workflow Associations
AutomationWorkflow.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

Organization.hasMany(AutomationWorkflow, {
  foreignKey: 'organizationId',
  as: 'workflows'
});

// A/B Testing Associations
ABExperiment.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

ABExperiment.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website'
});

ABExperiment.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

ABExperiment.hasMany(ABVariant, {
  foreignKey: 'experimentId',
  as: 'variants'
});

ABVariant.belongsTo(ABExperiment, {
  foreignKey: 'experimentId',
  as: 'experiment'
});

ABUserSegment.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

Organization.hasMany(ABUserSegment, {
  foreignKey: 'organizationId',
  as: 'userSegments'
});

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Skip automatic sync in development since pages table exists manually
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ alter: false });
    //   console.log('Database synchronized successfully.');
    // }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export {
  sequelize,
  User,
  Organization,
  UserOrganization,
  Website,
  Scan,
  Content,
  AITrackingResult,
  Page,
  Keyword,
  Competitor,
  TrackingSettings,
  PlatformSettings,
  AlertConfiguration,
  AlertHistory,
  MetricsSnapshot,
  AnalyticsSnapshot,
  CompetitorBenchmark,
  KeywordResearch,
  KeywordRanking,
  ReportTemplate,
  GeneratedReport,
  ScheduledReport,
  // Phase 3 Models
  MLModel,
  MLOptimizationSuggestion,
  ThirdPartyIntegration,
  Webhook,
  AutomationWorkflow,
  ABExperiment,
  ABVariant,
  ABUserSegment
};