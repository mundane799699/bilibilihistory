"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, Search, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { zhCN } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HistoryFiltersProps {
  keyword: string;
  fromDate?: string;
  toDate?: string;
  onKeywordChange: (value: string) => void;
  onDateChange: (fromDate?: string, toDate?: string) => void;
  onClear: () => void;
}

function parseLocalDate(value?: string) {
  if (!value) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateRange(fromDate?: string, toDate?: string): DateRange | undefined {
  const from = parseLocalDate(fromDate);
  if (!from) return undefined;

  return {
    from,
    to: parseLocalDate(toDate) ?? from,
  };
}

export function HistoryFilters({
  keyword,
  fromDate,
  toDate,
  onKeywordChange,
  onDateChange,
  onClear,
}: HistoryFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(() =>
    toDateRange(fromDate, toDate)
  );

  useEffect(() => {
    if (!isCalendarOpen) {
      setDraftRange(toDateRange(fromDate, toDate));
    }
  }, [fromDate, toDate, isCalendarOpen]);

  const dateLabel = useMemo(() => {
    if (!fromDate) return "筛选日期";
    if (!toDate || fromDate === toDate) return fromDate;
    return `${fromDate} 至 ${toDate}`;
  }, [fromDate, toDate]);

  const hasFilters = Boolean(keyword.trim() || fromDate || toDate);

  const handleCalendarOpenChange = (open: boolean) => {
    if (open) {
      setDraftRange(toDateRange(fromDate, toDate));
    }
    setIsCalendarOpen(open);
  };

  const applyDateRange = () => {
    if (!draftRange?.from) return;

    onDateChange(
      formatLocalDate(draftRange.from),
      formatLocalDate(draftRange.to ?? draftRange.from)
    );
    setIsCalendarOpen(false);
  };

  const clearDateRange = () => {
    setDraftRange(undefined);
    onDateChange();
    setIsCalendarOpen(false);
  };

  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <Input
            aria-label="搜索历史记录"
            className="pl-9 pr-9"
            maxLength={100}
            onChange={(event) => onKeywordChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && keyword) {
                onKeywordChange("");
              }
            }}
            placeholder="搜索标题、UP 主或分区"
            value={keyword}
          />
          {keyword && (
            <button
              aria-label="清空关键词"
              className="absolute right-2 top-1/2 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              onClick={() => onKeywordChange("")}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <Popover open={isCalendarOpen} onOpenChange={handleCalendarOpenChange}>
            <PopoverTrigger asChild>
              <Button
                aria-label="筛选观看日期"
                className="min-w-0 flex-1 justify-start font-normal md:w-[250px] md:flex-none"
                variant="outline"
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{dateLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                initialFocus
                locale={zhCN}
                mode="range"
                numberOfMonths={1}
                onSelect={setDraftRange}
                selected={draftRange}
              />
              <div className="flex items-center justify-between border-t p-3">
                <Button onClick={clearDateRange} size="sm" variant="ghost">
                  清除日期
                </Button>
                <Button
                  disabled={!draftRange?.from}
                  onClick={applyDateRange}
                  size="sm"
                >
                  应用
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button className="shrink-0" onClick={onClear} variant="ghost">
              清除筛选
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
