import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="top-[50%] translate-y-[-50%] sm:max-w-2xl max-h-[90vh] p-0 bg-black border-gray-800">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl text-center text-white">Terms and Conditions</DialogTitle>
        </DialogHeader>

        <div className="p-6 h-[60vh] overflow-y-auto">
          <div className="space-y-6 text-gray-300">
            <h2 className="text-lg font-semibold text-[#f1b917]">Creator Terms of Poster Submission</h2>
            <p>By submitting a poster for sale on Coffee&Prints, you ("the Creator") agree to the following terms:</p>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">1. Ownership & Rights Transfer</h3>
              <p>You affirm that the image you uploaded is your own, or that you have the legal right to use and transform it.</p>
              <p>You acknowledge that the poster generated through the Coffee&Prints platform incorporates proprietary styles, formatting, layout, and other creative elements owned by Coffee&Prints.</p>
              <p>By submitting your poster for sale, you assign all commercial rights in the final poster artwork to Coffee&Prints. This includes the rights to reproduce, distribute, sell, license, modify, and use the poster in any format and medium, globally and indefinitely.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">2. Revenue Sharing</h3>
              <p>For each sale of your submitted poster, you will receive a creator commission of 20% of the sale price.</p>
              <p>Payouts are issued monthly, provided your account contains accurate and up-to-date payment details.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">3. Attribution & Representation</h3>
              <p>You may be credited as the original creator of the uploaded photo or concept.</p>
              <p>Coffee&Prints retains sole discretion over how, where, and whether the poster is marketed, sold, or featured.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">4. Eligibility & Quality Control</h3>
              <p>We reserve the right to reject or remove any poster that does not meet our technical, legal, or aesthetic standards.</p>
              <p>This includes posters suspected of infringing copyright, violating community guidelines, or failing to meet print resolution or design criteria.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">5. Legal Warranty & Indemnity</h3>
              <p>You certify that your uploaded image does not infringe the intellectual property or privacy rights of any third party.</p>
              <p>You agree to indemnify Coffee&Prints against any claims or legal action resulting from the content you submit.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">6. Modifications</h3>
              <p>Coffee&Prints may update these terms from time to time. You will be notified of major changes. Continued use of the platform constitutes acceptance of any updated terms.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2">
          <Button 
            className="w-full px-6 py-3 bg-[#f1b917] hover:bg-opacity-90 text-white text-base shadow-lg shadow-[#f1b917]/30 font-bold"
            onClick={onClose}
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}