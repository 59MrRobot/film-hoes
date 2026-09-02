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
      color="primary"
      {...props}
      sx={{
        py: 1.5,
        letterSpacing: 4,
        textTransform: "uppercase",
        fontWeight: "bold",
        borderRadius: 2,
        boxShadow: 3,
        ...props.sx,
      }}
    >
      {label}
    </Button>
  );
}
