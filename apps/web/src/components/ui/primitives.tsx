import React from "react";

// ==========================================
// 1. TYPOGRAPHY PRIMITIVES
// ==========================================

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
  display?: boolean;
  children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 2,
  display = false,
  children,
  className = "",
  ...props
}) => {
  if (display) {
    return (
      <h1
        className={`font-display text-display tracking-tight text-text-primary ${className}`}
        {...props}
      >
        {children}
      </h1>
    );
  }

  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  const sizeClasses = {
    1: "text-h1 font-display tracking-tight text-text-primary",
    2: "text-h2 font-display tracking-tight text-text-primary",
    3: "text-h3 font-sans font-bold text-text-primary",
    4: "text-h4 font-sans font-semibold text-text-secondary",
  };

  return (
    <Tag
      className={`${sizeClasses[level]} ${className}`}
      {...(props as any)}
    >
      {children}
    </Tag>
  );
};

export const Body: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <p className={`text-body text-text-secondary font-sans leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const Subtle: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <span className={`text-body-sm text-text-subtle font-sans ${className}`} {...props}>
      {children}
    </span>
  );
};

export const Caption: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <span
      className={`text-caption font-semibold tracking-wider text-accent-primary uppercase font-display ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// ==========================================
// 2. LAYOUT PRIMITIVES
// ==========================================

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "base" | "raised" | "overlay" | "sunken";
  glass?: boolean;
  children: React.ReactNode;
}

export const Surface: React.FC<SurfaceProps> = ({
  variant = "raised",
  glass = true,
  children,
  className = "",
  ...props
}) => {
  const bgClasses = {
    base: "bg-surface-base",
    raised: "bg-surface-raised",
    overlay: "bg-surface-overlay",
    sunken: "bg-surface-sunken",
  };

  const glassStyle = glass
    ? "backdrop-blur-xl border border-white/5 shadow-2xl bg-opacity-70"
    : "border border-border-default/20 shadow-lg";

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${bgClasses[variant]} ${glassStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col";
  gap?: "none" | "small" | "default" | "large";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  children: React.ReactNode;
}

export const Stack: React.FC<StackProps> = ({
  direction = "col",
  gap = "default",
  align = "stretch",
  justify = "start",
  children,
  className = "",
  ...props
}) => {
  const dirClass = direction === "row" ? "flex-row" : "flex-col";
  
  const gapClasses = {
    none: "gap-0",
    small: "gap-2",
    default: "gap-4",
    large: "gap-8",
  };

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={`flex ${dirClass} ${gapClasses[gap]} ${alignClasses[align]} ${justifyClasses[justify]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ==========================================
// 3. FORM PRIMITIVES (MICRO-ANIMATED)
// ==========================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "default" | "large";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "default",
  icon,
  children,
  className = "",
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface-base active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer";

  const variantClasses = {
    primary:
      "bg-accent-primary hover:bg-accent-primary-hover text-text-on-accent shadow-lg shadow-accent-primary/20 border border-accent-primary/10",
    secondary:
      "bg-surface-overlay hover:bg-surface-overlay/80 text-text-primary border border-border-default/40 hover:border-border-strong",
    danger:
      "bg-accent-danger hover:bg-accent-danger/95 text-text-on-accent shadow-lg shadow-accent-danger/10",
    ghost:
      "bg-transparent hover:bg-white/5 text-text-secondary hover:text-text-primary",
  };

  const sizeClasses = {
    small: "px-3 py-1.5 text-body-sm gap-1.5",
    default: "px-5 py-2.5 text-body gap-2",
    large: "px-7 py-3 text-h4 gap-2.5",
  };

  const hasJustify = className.includes("justify-");
  const justifyClass = hasJustify ? "" : "justify-center";

  return (
    <button
      className={`${baseClasses} ${justifyClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || React.useId();
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-body-sm font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-xl bg-surface-sunken border border-border-default/60 hover:border-border-strong/50 focus:border-accent-primary focus:outline-none text-text-primary placeholder-text-subtle transition-all duration-200 focus:ring-1 focus:ring-accent-primary ${
          error ? "border-accent-danger/70 focus:border-accent-danger focus:ring-accent-danger" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-body-sm text-accent-danger font-medium mt-0.5">{error}</span>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  children,
  className = "",
  id,
  ...props
}) => {
  const selectId = id || React.useId();
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-body-sm font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-4 py-2.5 rounded-xl bg-surface-sunken border border-border-default/60 hover:border-border-strong/50 focus:border-accent-primary focus:outline-none text-text-primary transition-all duration-200 focus:ring-1 focus:ring-accent-primary cursor-pointer ${
          error ? "border-accent-danger/70 focus:border-accent-danger focus:ring-accent-danger" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-body-sm text-accent-danger font-medium mt-0.5">{error}</span>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  const textId = id || React.useId();
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={textId} className="text-body-sm font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        id={textId}
        rows={3}
        className={`w-full px-4 py-2.5 rounded-xl bg-surface-sunken border border-border-default/60 hover:border-border-strong/50 focus:border-accent-primary focus:outline-none text-text-primary placeholder-text-subtle transition-all duration-200 focus:ring-1 focus:ring-accent-primary resize-y ${
          error ? "border-accent-danger/70 focus:border-accent-danger focus:ring-accent-danger" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-body-sm text-accent-danger font-medium mt-0.5">{error}</span>}
    </div>
  );
};
