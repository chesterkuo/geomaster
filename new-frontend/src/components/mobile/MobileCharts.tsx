import { useState, useRef, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";

interface MobileChartWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onExpand?: () => void;
  actions?: React.ReactNode;
}

export const MobileChartWrapper = ({ 
  title, 
  children, 
  className, 
  onExpand,
  actions 
}: MobileChartWrapperProps) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Card 
      className={cn(
        "p-4 bg-gradient-card border-border transition-all duration-200",
        "hover:shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isPressed && "scale-[0.98] shadow-sm",
        className
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center space-x-2">
          {actions}
          {onExpand && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-8 h-8 p-0"
              onClick={onExpand}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Chart content */}
      <div className="w-full">
        {children}
      </div>
    </Card>
  );
};

// Custom tooltip for mobile charts
const MobileTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Mobile-optimized line chart
interface MobileLineChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
  color?: string;
  height?: number;
}

export const MobileLineChart = ({ 
  data, 
  xKey, 
  yKey, 
  title, 
  color = "#8b5cf6",
  height = 200 
}: MobileLineChartProps) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  
  const zoomedData = data.slice(startIndex, startIndex + Math.ceil(data.length / zoomLevel));

  const handleZoomIn = () => {
    if (zoomLevel < 4) setZoomLevel(zoomLevel * 2);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel(zoomLevel / 2);
      setStartIndex(0);
    }
  };

  const handleReset = () => {
    setZoomLevel(1);
    setStartIndex(0);
  };

  return (
    <MobileChartWrapper 
      title={title}
      actions={
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={handleZoomIn}>
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={handleZoomOut}>
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      }
    >
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={zoomedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey={xKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              width={40}
            />
            <Tooltip 
              content={<MobileTooltip />} 
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              strokeWidth={3}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6, fill: color, stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </MobileChartWrapper>
  );
};

// Mobile-optimized pie chart with touch interactions
interface MobilePieChartProps {
  data: any[];
  title: string;
  dataKey: string;
  nameKey: string;
  colors?: string[];
}

export const MobilePieChart = ({ 
  data, 
  title, 
  dataKey, 
  nameKey,
  colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"] 
}: MobilePieChartProps) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  return (
    <MobileChartWrapper title={title}>
      <div className="flex flex-col items-center">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={30}
                paddingAngle={2}
                dataKey={dataKey}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    stroke={activeIndex === index ? "#fff" : "transparent"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<MobileTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 w-full mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-foreground truncate">
                {item[nameKey]}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {item[dataKey]}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </MobileChartWrapper>
  );
};

// Mobile-optimized bar chart
interface MobileBarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
  color?: string;
}

export const MobileBarChart = ({ 
  data, 
  xKey, 
  yKey, 
  title, 
  color = "#8b5cf6" 
}: MobileBarChartProps) => {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  return (
    <MobileChartWrapper title={title}>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey={xKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              width={40}
            />
            <Tooltip content={<MobileTooltip />} />
            <Bar 
              dataKey={yKey} 
              fill={color}
              radius={[4, 4, 0, 0]}
              onMouseEnter={(_, index) => setSelectedBar(index)}
              onMouseLeave={() => setSelectedBar(null)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </MobileChartWrapper>
  );
};

// Mobile stats cards for quick insights
interface MobileStatsCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  compact?: boolean;
}

export const MobileStatsCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon,
  compact = false 
}: MobileStatsCardProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const trendColors = {
    up: "text-geo-green",
    down: "text-destructive",
    neutral: "text-muted-foreground"
  };

  const trendBgColors = {
    up: "bg-geo-green/10",
    down: "bg-destructive/10",
    neutral: "bg-muted/10"
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isPressed && "scale-95 shadow-sm",
        compact ? "p-3" : "p-4"
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={cn(
            "text-muted-foreground font-medium",
            compact ? "text-xs mb-1" : "text-sm mb-2"
          )}>
            {title}
          </p>
          <p className={cn(
            "font-bold text-foreground",
            compact ? "text-lg" : "text-2xl"
          )}>
            {value}
          </p>
          <div className={cn(
            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
            trendColors[trend],
            trendBgColors[trend]
          )}>
            {change}
          </div>
        </div>
        {icon && (
          <div className={cn(
            "flex-shrink-0 ml-3",
            compact ? "text-muted-foreground" : "text-primary"
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};