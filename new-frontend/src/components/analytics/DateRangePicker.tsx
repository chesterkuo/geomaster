import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

const predefinedRanges = [
  {
    label: '今天',
    value: '1d',
    getDays: () => 1
  },
  {
    label: '昨天', 
    value: 'yesterday',
    getDays: () => 1
  },
  {
    label: '過去 7 天',
    value: '7d',
    getDays: () => 7
  },
  {
    label: '過去 30 天',
    value: '30d', 
    getDays: () => 30
  },
  {
    label: '過去 90 天',
    value: '90d',
    getDays: () => 90
  },
  {
    label: '今年',
    value: 'year',
    getDays: () => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
];

export const DateRangePicker = ({ value, onChange, className }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('7d');

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    const now = new Date();
    
    if (preset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      onChange({ from: yesterday, to: yesterdayEnd });
    } else if (preset === '1d') {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      onChange({ from: today, to: now });
    } else if (preset === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      onChange({ from: startOfYear, to: now });
    } else {
      const days = parseInt(preset.replace('d', ''));
      const from = new Date(now);
      from.setDate(from.getDate() - days + 1);
      from.setHours(0, 0, 0, 0);
      onChange({ from, to: now });
    }
    setIsOpen(false);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    onChange(range);
    if (range?.from && range?.to) {
      setSelectedPreset('custom');
    }
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return '選擇日期範圍';
    if (!range.to) return format(range.from, 'yyyy-MM-dd');
    
    if (range.from.toDateString() === range.to.toDateString()) {
      return format(range.from, 'yyyy-MM-dd');
    }
    
    return `${format(range.from, 'yyyy-MM-dd')} - ${format(range.to, 'yyyy-MM-dd')}`;
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(value)}
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="flex flex-col space-y-2 p-3 border-r">
              <div className="text-sm font-medium text-foreground mb-2">快速選擇</div>
              {predefinedRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={selectedPreset === range.value ? "default" : "ghost"}
                  size="sm"
                  className="justify-start h-8 px-3 text-sm"
                  onClick={() => handlePresetSelect(range.value)}
                >
                  {range.label}
                </Button>
              ))}
              <Button
                variant={selectedPreset === 'custom' ? "default" : "ghost"}
                size="sm"
                className="justify-start h-8 px-3 text-sm"
                onClick={() => setSelectedPreset('custom')}
              >
                自定義範圍
              </Button>
            </div>
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={handleDateSelect}
                numberOfMonths={2}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border-t">
            <div className="text-sm text-muted-foreground">
              {value?.from && value?.to && (
                `已選擇 ${Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24))} 天`
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline" 
                size="sm"
                onClick={() => {
                  onChange(undefined);
                  setSelectedPreset('7d');
                }}
              >
                清除
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={!value?.from || !value?.to}
              >
                確認
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;