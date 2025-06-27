import * as React from "react"
import { cn } from "@/lib/utils"

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (files: File | File[] | null) => void
  multiple?: boolean
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, onChange, multiple = false, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (multiple) {
        const files = Array.from(e.target.files || []);
        onChange?.(files.length > 0 ? files : null);
      } else {
        const file = e.target.files?.[0] || null;
        onChange?.(file);
      }
    }

    return (
      <input
        type="file"
        multiple={multiple}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-blue-500 file:text-white file:px-3 file:py-1 file:rounded file:cursor-pointer file:hover:bg-blue-600 file:transition-colors file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
FileInput.displayName = "FileInput"

export { FileInput }
