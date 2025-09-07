import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  GripVertical,
  Trash2,
  Eye,
  Settings,
  BarChart3,
  Table,
  FileText,
  Image,
  Save,
  Copy,
  Palette,
  Layout,
  Monitor,
  Smartphone,
  Download,
  Loader2
} from 'lucide-react';
import {
  ReportSection,
  ChartConfig,
  TemplateConfig,
  ReportType,
  FileFormat,
  CreateReportTemplateData,
  UpdateReportTemplateData,
  ReportTemplate,
  reportsApi
} from '@/lib/api/reports';

/**
 * Section Type Options
 */
const SECTION_TYPES = [
  { value: 'chart', label: '圖表', icon: BarChart3, color: 'bg-blue-500' },
  { value: 'table', label: '表格', icon: Table, color: 'bg-green-500' },
  { value: 'text', label: '文字', icon: FileText, color: 'bg-purple-500' },
  { value: 'image', label: '圖片', icon: Image, color: 'bg-orange-500' }
] as const;

/**
 * Chart Type Options
 */
const CHART_TYPES = [
  { value: 'line', label: '線圖' },
  { value: 'bar', label: '長條圖' },
  { value: 'pie', label: '圓餅圖' },
  { value: 'area', label: '區域圖' },
  { value: 'scatter', label: '散點圖' }
] as const;

/**
 * Report Type Options
 */
const REPORT_TYPES = [
  { value: 'competitor_benchmark', label: '競爭對手基準分析' },
  { value: 'market_position', label: '市場定位分析' },
  { value: 'swot_analysis', label: 'SWOT 分析' },
  { value: 'keyword_analysis', label: '關鍵字分析' },
  { value: 'custom', label: '自訂報告' }
] as const;

/**
 * File Format Options
 */
const FILE_FORMATS = [
  { value: 'pdf', label: 'PDF 文件' },
  { value: 'excel', label: 'Excel 試算表' },
  { value: 'csv', label: 'CSV 文件' },
  { value: 'json', label: 'JSON 數據' }
] as const;

/**
 * Props interface for ReportTemplateBuilder
 */
interface ReportTemplateBuilderProps {
  /**
   * Optional existing template to edit
   */
  template?: ReportTemplate;
  /**
   * Callback when template is saved
   */
  onSave?: (template: ReportTemplate) => void;
  /**
   * Callback when builder is closed
   */
  onClose?: () => void;
  /**
   * Whether the builder is in modal mode
   */
  isModal?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * ReportTemplateBuilder Component
 * 
 * A comprehensive drag-and-drop report template builder with:
 * - Visual section management
 * - Chart configuration
 * - Format selection
 * - Preview functionality
 * - Template validation
 */
export const ReportTemplateBuilder: React.FC<ReportTemplateBuilderProps> = ({
  template,
  onSave,
  onClose,
  isModal = false,
  className = ''
}) => {
  // ===== State Management =====
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [reportType, setReportType] = useState<ReportType>(template?.reportType || 'custom');
  const [fileFormat, setFileFormat] = useState<FileFormat>(template?.templateConfig.format || 'pdf');
  const [sections, setSections] = useState<ReportSection[]>(template?.templateConfig.sections || []);
  const [charts, setCharts] = useState<ChartConfig[]>(template?.templateConfig.charts || []);
  const [branding, setBranding] = useState(template?.templateConfig.branding || false);
  const [customizations, setCustomizations] = useState(template?.templateConfig.customizations || {});
  const [isPublic, setIsPublic] = useState(template?.isPublic || false);

  // UI State
  const [activeTab, setActiveTab] = useState('sections');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // New Section/Chart State
  const [newSection, setNewSection] = useState<Partial<ReportSection>>({
    name: '',
    type: 'chart',
    config: {},
    order: sections.length
  });
  const [newChart, setNewChart] = useState<Partial<ChartConfig>>({
    type: 'line',
    title: '',
    dataSource: '',
    xAxis: '',
    yAxis: ''
  });

  // ===== Event Handlers =====

  /**
   * Handle drag end for sections reordering
   */
  const handleSectionDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const reorderedSections = Array.from(sections);
    const [removed] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, removed);

    // Update order values
    const updatedSections = reorderedSections.map((section, index) => ({
      ...section,
      order: index
    }));

    setSections(updatedSections);
  }, [sections]);

  /**
   * Add new section
   */
  const handleAddSection = useCallback(() => {
    if (!newSection.name || !newSection.type) {
      toast.error('請填寫區段名稱和類型');
      return;
    }

    const section: ReportSection = {
      id: `section-${Date.now()}`,
      name: newSection.name,
      type: newSection.type as ReportSection['type'],
      config: newSection.config || {},
      order: sections.length
    };

    setSections(prev => [...prev, section]);
    setNewSection({ name: '', type: 'chart', config: {}, order: sections.length + 1 });
    setShowSectionDialog(false);
    toast.success('區段已新增');
  }, [newSection, sections.length]);

  /**
   * Delete section
   */
  const handleDeleteSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
    toast.success('區段已刪除');
  }, [selectedSection]);

  /**
   * Add new chart
   */
  const handleAddChart = useCallback(() => {
    if (!newChart.title || !newChart.dataSource) {
      toast.error('請填寫圖表標題和數據來源');
      return;
    }

    const chart: ChartConfig = {
      type: newChart.type as ChartConfig['type'],
      title: newChart.title,
      dataSource: newChart.dataSource,
      xAxis: newChart.xAxis || '',
      yAxis: newChart.yAxis || ''
    };

    setCharts(prev => [...prev, chart]);
    setNewChart({ type: 'line', title: '', dataSource: '', xAxis: '', yAxis: '' });
    setShowChartDialog(false);
    toast.success('圖表已新增');
  }, [newChart]);

  /**
   * Save template
   */
  const handleSave = useCallback(async () => {
    if (!templateName.trim()) {
      toast.error('請填寫模板名稱');
      return;
    }

    if (sections.length === 0) {
      toast.error('至少需要一個區段');
      return;
    }

    setIsSaving(true);

    try {
      const templateConfig: TemplateConfig = {
        sections,
        charts,
        format: fileFormat,
        branding,
        customizations
      };

      if (template) {
        // Update existing template
        const updateData: UpdateReportTemplateData = {
          name: templateName,
          templateConfig,
          isPublic
        };
        
        const response = await reportsApi.updateTemplate(template.id, updateData);
        toast.success('模板已更新');
        onSave?.(response.data.template as ReportTemplate);
      } else {
        // Create new template
        const createData: CreateReportTemplateData = {
          name: templateName,
          reportType,
          templateConfig,
          isPublic
        };
        
        const response = await reportsApi.createTemplate(createData);
        toast.success('模板已創建');
        onSave?.(response.data.template as ReportTemplate);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '保存模板失敗');
    } finally {
      setIsSaving(false);
    }
  }, [
    templateName,
    sections,
    charts,
    fileFormat,
    branding,
    customizations,
    isPublic,
    reportType,
    template,
    onSave
  ]);

  /**
   * Validate template
   */
  const validateTemplate = useCallback(() => {
    const errors: string[] = [];
    
    if (!templateName.trim()) errors.push('模板名稱為必填');
    if (sections.length === 0) errors.push('至少需要一個區段');
    
    sections.forEach((section, index) => {
      if (!section.name) errors.push(`區段 ${index + 1} 缺少名稱`);
    });

    return errors;
  }, [templateName, sections]);

  // ===== Effects =====
  useEffect(() => {
    const errors = validateTemplate();
    // You can use this for real-time validation feedback
  }, [validateTemplate]);

  // ===== Render Functions =====

  /**
   * Render section item
   */
  const renderSectionItem = (section: ReportSection, index: number) => {
    const sectionType = SECTION_TYPES.find(type => type.value === section.type);
    const Icon = sectionType?.icon || FileText;

    return (
      <Draggable key={section.id} draggableId={section.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`
              p-4 border border-border rounded-lg bg-background transition-all
              ${snapshot.isDragging ? 'shadow-lg scale-105' : 'hover:shadow-md'}
              ${selectedSection === section.id ? 'ring-2 ring-primary' : ''}
            `}
            onClick={() => setSelectedSection(section.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div {...provided.dragHandleProps} className="cursor-grab">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className={`p-2 rounded ${sectionType?.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium">{section.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {sectionType?.label} • 順序: {section.order + 1}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{sectionType?.label}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle section configuration
                  }}
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSection(section.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  /**
   * Render chart configuration
   */
  const renderChartConfig = (chart: ChartConfig, index: number) => (
    <Card key={index}>
      <CardHeader>
        <CardTitle className="text-base">{chart.title}</CardTitle>
        <CardDescription>
          {CHART_TYPES.find(type => type.value === chart.type)?.label} • 數據源: {chart.dataSource}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label>X 軸</Label>
            <p className="text-muted-foreground">{chart.xAxis || '未設定'}</p>
          </div>
          <div>
            <Label>Y 軸</Label>
            <p className="text-muted-foreground">{chart.yAxis || '未設定'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  /**
   * Render preview
   */
  const renderPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">模板預覽</h3>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-2" />
            桌面
          </Button>
          <Button
            size="sm"
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            手機
          </Button>
        </div>
      </div>

      <div className={`
        border-2 border-dashed border-border rounded-lg p-4 
        ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'}
      `}>
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold">{templateName || '未命名模板'}</h2>
            <p className="text-muted-foreground">
              {REPORT_TYPES.find(type => type.value === reportType)?.label}
            </p>
          </div>

          {sections.map((section, index) => {
            const sectionType = SECTION_TYPES.find(type => type.value === section.type);
            const Icon = sectionType?.icon || FileText;
            
            return (
              <div key={section.id} className="p-3 border border-border rounded bg-muted/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{section.name}</span>
                </div>
                <div className="h-20 bg-gradient-to-r from-muted to-muted/50 rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {sectionType?.label} 內容預覽
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ===== Main Render =====

  const builderContent = (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {template ? '編輯報告模板' : '建立報告模板'}
          </h2>
          <p className="text-muted-foreground">
            設計自訂報告模板，包含區段、圖表和格式設定
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存模板
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Basic Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="templateName">模板名稱</Label>
          <Input
            id="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="輸入模板名稱"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="reportType">報告類型</Label>
          <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="fileFormat">輸出格式</Label>
          <Select value={fileFormat} onValueChange={(value: FileFormat) => setFileFormat(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILE_FORMATS.map(format => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sections">區段配置</TabsTrigger>
          <TabsTrigger value="charts">圖表設定</TabsTrigger>
          <TabsTrigger value="styling">樣式設定</TabsTrigger>
          <TabsTrigger value="preview">預覽</TabsTrigger>
        </TabsList>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">報告區段</h3>
            <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新增區段
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新增報告區段</DialogTitle>
                  <DialogDescription>
                    配置新的報告區段類型和屬性
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>區段名稱</Label>
                    <Input
                      value={newSection.name || ''}
                      onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="輸入區段名稱"
                    />
                  </div>
                  <div>
                    <Label>區段類型</Label>
                    <Select
                      value={newSection.type}
                      onValueChange={(value) => setNewSection(prev => ({ ...prev, type: value as ReportSection['type'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <type.icon className="h-4 w-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddSection}>
                    新增區段
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <DragDropContext onDragEnd={handleSectionDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {sections.map((section, index) => renderSectionItem(section, index))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {sections.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <Layout className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">尚無報告區段</h3>
              <p className="text-muted-foreground mb-4">
                開始建立您的第一個報告區段
              </p>
              <Button onClick={() => setShowSectionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新增區段
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">圖表配置</h3>
            <Dialog open={showChartDialog} onOpenChange={setShowChartDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新增圖表
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>新增圖表</DialogTitle>
                  <DialogDescription>
                    配置圖表類型和數據來源
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>圖表標題</Label>
                    <Input
                      value={newChart.title || ''}
                      onChange={(e) => setNewChart(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="輸入圖表標題"
                    />
                  </div>
                  <div>
                    <Label>圖表類型</Label>
                    <Select
                      value={newChart.type}
                      onValueChange={(value) => setNewChart(prev => ({ ...prev, type: value as ChartConfig['type'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHART_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>數據來源</Label>
                    <Input
                      value={newChart.dataSource || ''}
                      onChange={(e) => setNewChart(prev => ({ ...prev, dataSource: e.target.value }))}
                      placeholder="輸入數據來源"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>X 軸</Label>
                      <Input
                        value={newChart.xAxis || ''}
                        onChange={(e) => setNewChart(prev => ({ ...prev, xAxis: e.target.value }))}
                        placeholder="X 軸標籤"
                      />
                    </div>
                    <div>
                      <Label>Y 軸</Label>
                      <Input
                        value={newChart.yAxis || ''}
                        onChange={(e) => setNewChart(prev => ({ ...prev, yAxis: e.target.value }))}
                        placeholder="Y 軸標籤"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowChartDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddChart}>
                    新增圖表
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {charts.map((chart, index) => renderChartConfig(chart, index))}
          </div>

          {charts.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">尚無圖表配置</h3>
              <p className="text-muted-foreground mb-4">
                為您的報告添加數據可視化圖表
              </p>
              <Button onClick={() => setShowChartDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新增圖表
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Styling Tab */}
        <TabsContent value="styling" className="space-y-4">
          <h3 className="text-lg font-medium">樣式與品牌設定</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="branding"
                checked={branding}
                onChange={(e) => setBranding(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="branding">啟用品牌化樣式</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isPublic">公開此模板</Label>
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          {renderPreview()}
        </TabsContent>
      </Tabs>
    </div>
  );

  // Return modal or inline content
  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {builderContent}
        </DialogContent>
      </Dialog>
    );
  }

  return builderContent;
};

export default ReportTemplateBuilder;