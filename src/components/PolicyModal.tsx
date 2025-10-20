import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PolicyModalProps {
  title: string;
  children: React.ReactNode;
  triggerText: React.ReactNode;
}

export default function PolicyModal({ title, children, triggerText }: PolicyModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setIsOpen(true); }}
          className="text-white hover:text-opacity-80 transition-all cursor-pointer text-xs"
        >
          {triggerText}
        </a>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4 text-white">{title}</DialogTitle>
        </DialogHeader>
        {/* Using div instead of DialogDescription to avoid nesting issues */}
        <div className="text-white opacity-80">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
