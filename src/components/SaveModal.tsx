import React from "react";
import { X, Download, Instagram } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isProcessing: boolean;
}

const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isProcessing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h3 className="text-xl font-racing-sans text-white">Share Your Creation</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5">
          <p className="text-gray-300 mb-6">
            Download your creation to share or print it!
          </p>

          <div className="mb-6">
            {/* Instagram - Keep only this one social network */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="h-10 w-10 bg-pink-900 bg-opacity-30 rounded-full flex items-center justify-center text-pink-400">
                  <Instagram size={20} />
                </div>
                <div className="ml-3">
                  <p className="text-white font-medium">Instagram</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Tag <span className="font-semibold text-pink-400">@posterthemoment</span> in your post or story
              </p>
            </div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="h-14 w-14 bg-[#f1b917]/20 rounded-full flex items-center justify-center text-[#f1b917]">
                <Download size={28} />
              </div>
            </div>
            <p className="text-gray-300 text-sm text-center">
              Your poster will be saved in <span className="font-semibold">gallery-grade A3 format</span> with a professional white border
            </p>
          </div>

          {/* Footer with Button */}
          <div className="pt-4">
            <Button
              onClick={onSave}
              disabled={isProcessing}
              className="w-full bg-[#f1b917] hover:bg-opacity-90 text-white font-bold py-3"
            >
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Image
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;