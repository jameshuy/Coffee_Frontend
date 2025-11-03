import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { ModalHeader } from "@/components/ui/modal-parts";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({
  isOpen,
  onClose,
}: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="top-[50%] translate-y-[-50%] sm:max-w-md bg-black border-gray-800">
        <div className="pt-6">
          <ModalHeader title="Welcome" description="" />
        </div>

        <div className="text-gray-300 text-center py-6">
          <p className="text-lg font-semibold text-[#f1b917]">Your email has been verified successfully!</p>
        </div>

        <DialogFooter className="flex justify-center mt-4">
          <Button 
            className="px-6 py-3 bg-[#f1b917] hover:bg-opacity-90 text-white text-base shadow-lg shadow-[#f1b917]/30 font-bold w-full"
            onClick={onClose}
          >
            Start Creating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}