import { PropsWithChildren } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ModalHeaderProps {
  title: string;
  description?: string | null;
  center?: boolean;
}

export function ModalHeader({ title, description, center = true }: ModalHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle
        className={`font-racing-sans text-2xl text-white ${center ? "text-center" : ""}`}
      >
        {title}
      </DialogTitle>
      {description !== undefined && (
        <DialogDescription className={`text-white ${center ? "text-center" : ""}`}>
          {description}
        </DialogDescription>
      )}
    </DialogHeader>
  );
}

export function ModalActions({ children }: PropsWithChildren) {
  return <div className="flex gap-2 sm:justify-center mt-4">{children}</div>;
}


