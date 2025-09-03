import { Button } from '@/components/ui/Button';
import { Link } from 'wouter';

interface UnauthenticatedViewProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export default function UnauthenticatedView({ onLoginClick, onSignupClick }: UnauthenticatedViewProps) {
  return (
    <div className="w-full mx-auto flex flex-col items-center">
      
      {/* Spacer for layout */}
      <div className="mb-8 mt-8">
      </div>
      
      {/* Login and Sign-up buttons */}
      <div className="flex flex-row items-center justify-center w-full space-x-4 mb-4">
        <Button 
          onClick={onLoginClick}
          className="bg-white text-black px-6 py-2 rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-lg"
        >
          Login
        </Button>
        
        <Button 
          onClick={onSignupClick}
          className="bg-white text-black px-6 py-2 rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-lg"
        >
          Sign Up
        </Button>
      </div>
      
      {/* "or" text */}
      <div className="flex justify-center w-full mb-4">
        <p className="text-center text-gray-300 font-notosans text-lg">
          or
        </p>
      </div>
      
      {/* Browse the Catalogue button */}
      <div className="flex justify-center w-full mb-4">
        <Link href="/catalogue">
          <Button 
            className="bg-transparent border border-white text-white px-6 py-2 rounded font-racing-sans hover:bg-white hover:text-black transition-colors duration-200 text-lg"
          >
            Browse the Catalogue
          </Button>
        </Link>
      </div>
      

    </div>
  );
}