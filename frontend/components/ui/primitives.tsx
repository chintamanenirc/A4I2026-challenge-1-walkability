"use client";

import React from "react";

export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/*                                   Button                                   */
/* -------------------------------------------------------------------------- */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "amber" | "emerald";
  size?: "default" | "sm" | "xs" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default:
        "bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm border border-zinc-200/80 font-medium",
      secondary:
        "bg-zinc-800/90 text-zinc-100 hover:bg-zinc-700/90 border border-zinc-700/80 font-medium",
      outline:
        "bg-transparent text-zinc-200 border border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-700",
      ghost:
        "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80",
      destructive:
        "bg-red-950/70 text-red-200 border border-red-800/70 hover:bg-red-900/80 hover:text-white",
      amber:
        "bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 hover:text-amber-200",
      emerald:
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 hover:text-emerald-200",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      default: "h-9 px-3.5 py-2 text-xs rounded-lg",
      sm: "h-8 px-3 py-1.5 text-xs rounded-md",
      xs: "h-7 px-2.5 py-1 text-[11px] rounded-md",
      lg: "h-10 px-4 py-2 text-sm rounded-lg",
      icon: "h-8 w-8 rounded-lg flex items-center justify-center p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:opacity-45 disabled:pointer-events-none cursor-pointer select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

/* -------------------------------------------------------------------------- */
/*                                    Badge                                   */
/* -------------------------------------------------------------------------- */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "emerald"
    | "amber"
    | "blue"
    | "red"
    | "purple";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-zinc-800 text-zinc-200 border-zinc-700",
    secondary: "bg-zinc-900/90 text-zinc-400 border-zinc-800",
    outline: "bg-transparent text-zinc-300 border-zinc-700/80",
    emerald: "bg-emerald-950/70 text-emerald-300 border-emerald-800/70",
    amber: "bg-amber-950/70 text-amber-300 border-amber-800/70",
    blue: "bg-sky-950/70 text-sky-300 border-sky-800/70",
    red: "bg-red-950/70 text-red-300 border-red-800/70",
    purple: "bg-purple-950/70 text-purple-300 border-purple-800/70",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Card                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800/90 bg-zinc-900/60 text-zinc-100 shadow-sm backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1 p-4", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xs font-semibold leading-none tracking-tight text-zinc-100",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[11px] text-zinc-400 leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

/* -------------------------------------------------------------------------- */
/*                                  Progress                                  */
/* -------------------------------------------------------------------------- */

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorClassName?: string;
}

export function Progress({
  value,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/90",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full transition-all duration-300 ease-out rounded-full bg-gradient-to-r from-amber-500 via-sky-400 to-emerald-400",
          indicatorClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Separator                                 */
/* -------------------------------------------------------------------------- */

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={cn(
        "shrink-0 bg-zinc-800/80",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  );
}
