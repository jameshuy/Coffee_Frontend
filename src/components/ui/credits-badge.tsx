import { CreditCard } from 'lucide-react';

interface CreditsBadgeProps {
  isArtisticCollective: boolean;
  availableCredits: number;
  onClick: () => void;
}

export default function CreditsBadge({ isArtisticCollective, availableCredits, onClick }: CreditsBadgeProps) {
  return (
    <button 
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded-md font-medium flex items-center transition-colors cursor-pointer ${
        isArtisticCollective
          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700'
          : availableCredits === 0 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-white text-black hover:bg-[#f1b917]'
      }`}
    >
      <CreditCard size={14} className="mr-1" />
      {isArtisticCollective ? '∞' : availableCredits}
    </button>
  );
}


