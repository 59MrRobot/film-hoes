import { Button } from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";

interface CustomButtonProps extends Omit<ButtonProps, "children"> {
  label: string;
}

export default function CustomButton({ label, onClick, ...props }: CustomButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="contained"
      color={props.color || "secondary"}
      {...props}
      sx={{
        py: props.size === "small" ? 0.75 : 1.5,
        px: props.size === "small" ? 2 : 4,
        letterSpacing: props.size === "small" ? 1.5 : 4,
        fontSize: props.size === "small" ? "0.75rem" : "0.9rem",
        textTransform: "uppercase",
        fontWeight: 800,
        borderRadius: props.variant === "outlined" ? 1 : 2,
        position: "relative",
        overflow: "hidden",
        border: props.variant === "outlined" ? "2px solid" : undefined,

        // Base state for Contained & Outlined
        backgroundImage:
          props.variant === "text"
            ? undefined
            : props.variant === "outlined"
              ? "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.02) 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.1) 100%)",

        boxShadow:
          props.variant === "text"
            ? 0
            : props.variant === "outlined"
              ? "0 2px 6px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.2)"
              : "0 4px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",

        color: props.variant === "outlined" || props.variant === "text" ? undefined : "black",
        textShadow: props.variant === "contained" ? "0 1px 1px rgba(255,255,255,0.3)" : undefined,

        // Smooth cinematic animations
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",

        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            props.variant === "text"
              ? "0 4px 15px rgba(0,0,0,0.1)"
              : props.variant === "outlined"
                ? "0 6px 15px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)"
                : "0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
          // Subtle glow effect
          "&::after": {
            opacity: 1,
          },
        },
        "&:active": {
          transform: "translateY(1px)",
          boxShadow: props.variant === "text" ? "none" : props.variant === "outlined" ? "0 1px 2px rgba(0,0,0,0.1)" : "0 2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.2)",
        },

        // Optional overlay for extra shine on hover
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)",
          opacity: 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        },

        ...props.sx,
      }}
    >
      {label}
    </Button>
  );
}
