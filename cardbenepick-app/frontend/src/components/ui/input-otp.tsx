"use client"

import * as React from "react"
// 1. 'useSlot'을 제거하고, 'OTPInputContext'만 올바르게 임포트합니다.
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

// 2. 오류를 유발했던 Context 재정의 라인을 삭제합니다. (중요)

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  // 3. 올바른 Context를 사용합니다.
  const inputOTPContext = React.useContext(OTPInputContext)
  
  // 4. 'useSlot' 대신 Context의 'slots' 배열을 직접 사용합니다. (원래 방식)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {/* 5. 마스킹 로직을 'slots' 데이터로 구현합니다. */}
      {char ? (
        // 문자가 있고, 활성화(포커스) 상태가 아니면 Dot(•)을 보여줍니다.
        <div>{isActive ? char : <Dot className="h-4 w-4" />}</div>
      ) : (
        // 문자가 없으면 캐럿(커서)을 표시합니다.
        <>
          {hasFakeCaret && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
            </div>
          )}
        </>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }