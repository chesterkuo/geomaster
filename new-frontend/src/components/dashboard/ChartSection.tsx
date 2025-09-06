import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const getTrendData = (isAuthenticated: boolean) => [
  { name: '週一', value: isAuthenticated ? 45 : 0 },
  { name: '週二', value: isAuthenticated ? 52 : 0 },
  { name: '週三', value: isAuthenticated ? 48 : 0 },
  { name: '週四', value: isAuthenticated ? 61 : 0 },
  { name: '週五', value: isAuthenticated ? 55 : 0 },
  { name: '週六', value: isAuthenticated ? 67 : 0 },
  { name: '週日', value: isAuthenticated ? 58 : 0 },
];

const getPieData = (isAuthenticated: boolean) => [
  { name: 'ChatGPT', value: isAuthenticated ? 82 : 0, color: '#8b5cf6' },
  { name: 'Gemini', value: isAuthenticated ? 75 : 0, color: '#3b82f6' },
  { name: 'Perplexity', value: isAuthenticated ? 77 : 0, color: '#10b981' },
];

interface ChartSectionProps {
  isAuthenticated?: boolean;
}

export const ChartSection = ({ isAuthenticated = false }: ChartSectionProps) => {
  const trendData = getTrendData(isAuthenticated);
  const pieData = getPieData(isAuthenticated);
  const overallScore = isAuthenticated ? 78 : 0;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* AI Platform Visibility Trend */}
      <Card className="lg:col-span-2 p-6 bg-gradient-card border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">AI 平台可見度趨勢</h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground border-primary">
              7天
            </Button>
            <Button variant="outline" size="sm">30天</Button>
            <Button variant="outline" size="sm">90天</Button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--geo-purple))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--geo-purple))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--geo-purple))', strokeWidth: 2, fill: 'hsl(var(--geo-purple))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* AI Scores */}
      <Card className="p-6 bg-gradient-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-6">AI 綜合評分</h3>
        
        <div className="relative w-48 h-48 mx-auto mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[{ value: overallScore }, { value: isAuthenticated ? 22 : 100 }]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={450}
                dataKey="value"
              >
                <Cell fill="hsl(var(--geo-purple))" />
                <Cell fill="hsl(var(--border))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{isAuthenticated ? '78' : '---'}</div>
              <div className="text-sm text-muted-foreground">綜合評分</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{isAuthenticated ? item.value : '---'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};