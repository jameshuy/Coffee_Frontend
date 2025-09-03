import { Button } from "@/components/ui/Button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gold-500 text-lg mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-gold-500 hover:bg-gold-600 text-black">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}