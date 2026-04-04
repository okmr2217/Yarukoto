"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CircleCheck, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonthlyTaskStats } from "@/hooks";
import type { DayTaskStats } from "@/types";
import { cn } from "@/lib/utils";
import {
  formatDateToJST,
  isTodayInJST,
  toJSTDate,
} from "@/lib/dateUtils";

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  const firstDayOfWeek = firstDay.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(new Date(0));
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function formatMonthYear(date: Date): string {
  const zonedDate = toJSTDate(date);
  return zonedDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });
}

function getMonthString(date: Date): string {
  const zonedDate = toJSTDate(date);
  const year = zonedDate.getFullYear();
  const month = String(zonedDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

interface DateCellProps {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  stats?: DayTaskStats;
  onClick: () => void;
}

function DateCell({
  date,
  isToday,
  isSelected,
  stats,
  onClick,
}: DateCellProps) {
  const isEmpty = date.getTime() === 0;

  if (isEmpty) {
    return <div className="aspect-square" />;
  }

  const hasStats = stats && (stats.total > 0 || stats.completed > 0 || stats.createdCount > 0);

  const cellContent = (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-2 rounded-lg transition-colors flex flex-col items-center relative",
        "hover:bg-accent",
        "h-20 min-h-20",
        isToday && "bg-primary/10 font-bold",
        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
        !hasStats && "text-muted-foreground",
      )}
    >
      <span className="text-base mb-1">{date.getDate()}</span>
      {hasStats ? (
        <div className="flex flex-col items-center gap-1.5 w-full mt-auto mb-0.5">
          <div className="flex items-center gap-1.5 font-semibold flex-wrap justify-center">
            {stats.completed > 0 && (
              <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                <CircleCheck className="h-3.5 w-3.5" />
                <span className="text-base leading-none">{stats.completed}</span>
              </span>
            )}
            {stats.createdCount > 0 && (
              <span className="flex items-center gap-0.5 text-muted-foreground">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="text-base leading-none">{stats.createdCount}</span>
              </span>
            )}
            {stats.total > 0 && (
              <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="text-base leading-none">{stats.total}</span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </button>
  );

  return cellContent;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const router = useRouter();
  const [viewDate, setViewDate] = useState(new Date());

  const monthString = getMonthString(viewDate);
  const { data: stats } = useMonthlyTaskStats(monthString);

  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    const dateString = formatDateToJST(date);
    router.push(`/?date=${dateString}`);
  };

  return (
    <div className="flex-1 bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div>
          <div className="p-4">
          <h1 className="text-lg font-semibold mb-1.5">カレンダー</h1>
          <p className="text-xs text-muted-foreground mb-4">
            月ごとのタスク集計を確認できます。日付をクリックするとその日のタスク一覧に移動します。
          </p>

          {/* 凡例 */}
          <div className="mb-4 text-xs text-muted-foreground border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-5 flex-wrap">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CircleCheck className="h-3.5 w-3.5" />
                完了
              </span>
              <span className="flex items-center gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                作成
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <CalendarDays className="h-3.5 w-3.5" />
                予定
              </span>
            </div>
          </div>

          {/* 月選択 */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              aria-label="前月"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-bold">
              {formatMonthYear(viewDate)}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              aria-label="次月"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* 曜日ラベル */}
          <div className="grid grid-cols-7 gap-0 md:gap-2 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-0 md:gap-2">
            {days.map((date, index) => {
              const dateString = formatDateToJST(date);
              return (
                <DateCell
                  key={index}
                  date={date}
                  isToday={isTodayInJST(date)}
                  isSelected={false}
                  stats={stats?.[dateString]}
                  onClick={() => handleSelectDate(date)}
                />
              );
            })}
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
