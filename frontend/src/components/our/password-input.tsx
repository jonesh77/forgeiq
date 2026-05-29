"use client";

import { Input } from "@/components/ui/input";
import { useState, forwardRef } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Input>;

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
        >
          {visible ? <IoEyeOff className="text-lg" /> : <IoEye className="text-lg" />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
