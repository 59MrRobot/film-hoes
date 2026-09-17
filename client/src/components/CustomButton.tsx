import React from "react";
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
        py: props.size === "small" ? 0.5 : 1.5,
        letterSpacing: props.size === "small" ? 1 : 4,
        fontSize: props.size === "small" ? "0.75rem" : undefined,
        textTransform: "uppercase",
        fontWeight: "bold",
        borderRadius: 2,
        boxShadow: props.variant === "text" || props.variant === "outlined" ? 0 : 3,
        color: props.variant === "outlined" || props.variant === "text" ? undefined : "black",
        ...props.sx,
      }}
    >
      {label}
    </Button>
  );
}
