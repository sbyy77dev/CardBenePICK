import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 w-full", className)} 
      classNames={{
        // [수정] 달력 전체 크기를 부모에 맞춤
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full", 
        month: "space-y-4 w-full", 
        
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-base font-bold text-gray-900", // 년월 글씨 진하게
        
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-gray-200"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        
        table: "w-full border-collapse space-y-1", 
        
        // [수정] 요일(월화수목...) 헤더를 가로 꽉 차게 균등 분배
        head_row: "flex w-full justify-between", 
        head_cell:
          "text-gray-500 rounded-md w-full font-medium text-[0.8rem] py-1 text-center", 
        
        // [수정] 날짜 행(Row)을 가로 꽉 차게
        row: "flex w-full mt-2 justify-between gap-1", 
        
        // [수정] 각 날짜 셀(Cell)도 꽉 차게
        cell: "h-10 w-full text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-blue-50/50 [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        
        // [수정] 날짜 버튼 스타일 (가장 중요)
        // 기존 w-9(고정너비)를 제거하고 w-full로 변경
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
        ),
        
        day_range_end: "day-range-end",
        
        // [수정] 선택된 날짜: 확실한 파란색 (bg-blue-600)
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white shadow-md font-bold rounded-lg",
        
        // [수정] 오늘 날짜: 연한 파란색 글씨 + 배경
        day_today: "bg-blue-50 text-blue-600 font-bold border border-blue-200",
        
        day_outside:
          "day-outside text-gray-300 opacity-50 aria-selected:bg-blue-50/50 aria-selected:text-gray-400 aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-blue-50 aria-selected:text-blue-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4 text-gray-600" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4 text-gray-600" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };