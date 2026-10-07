import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  _variant?: "default" | "primary" | "secondary" | "ghost";
  _size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      _variant = "default",
      _size = "default",
      asChild = false,
      loading = false,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const handleLoading = () => {
      if (loading && !props.children) {
        return (
          <span className="flex items-center justify-center h-4 w-4">
            Loading...
          </span>
        );
      }
      return props.children;
    };

    const Composed = asChild ? React.Fragment : "button";

    return (
      <Composed
        ref={ref}
        className={className}
        disabled={loading || disabled}
        {...props}
      >
        {handleLoading()}
      </Composed>
    );
  },
);

Button.displayName = "Button";
