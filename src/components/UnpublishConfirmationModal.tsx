import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { EyeOff } from "lucide-react";

interface UnpublishConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isUnpublishing: boolean;
}

export default function UnpublishConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isUnpublishing,
}: UnpublishConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="top-[50%] translate-y-[-50%] sm:max-w-md bg-black border border-gray-800 text-white"
        style={{ zIndex: 60 }} // Higher z-index than the poster view modal
      >
        <VisuallyHidden>
          <DialogTitle>Unpublish Poster</DialogTitle>
        </VisuallyHidden>
        
        <div className="flex flex-col items-center space-y-6 p-6">
          {/* Title */}
          <h2 className="text-xl font-bold text-white text-center">
            Unpublish Poster
          </h2>
          
          {/* Confirmation text */}
          <p className="text-gray-300 text-center">
            Are you sure you want to unpublish this poster?
          </p>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-4 w-full">
            {/* Cancel button */}
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              disabled={isUnpublishing}
            >
              Cancel
            </Button>
            
            {/* Unpublish button */}
            <Button
              onClick={onConfirm}
              className="flex-1 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 flex items-center justify-center space-x-2"
              disabled={isUnpublishing}
            >
              <EyeOff className="w-4 h-4" />
              <span>{isUnpublishing ? "Unpublishing..." : "Unpublish"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}