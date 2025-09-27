import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import DashboardImageModal from "@/components/DashboardImageModal";
import ShareModal from "@/components/ShareModal";
import SubscriptionModal from "@/components/SubscriptionModal";

interface UserImage {
  id: string;
  thumbnailPath: string;
  originalPath: string;
  imageUrl: string;
  fullImageUrl: string;
  style: string;
  createdAt: string;
  isPublic: boolean;
  isSaved: boolean;
  validate: boolean;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<UserImage | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState("");
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Redirect unauthenticated users to create page
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/create');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const openImageModal = (image: UserImage) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Fetch user's generated images (only if authenticated)
  const { data: userImages, isLoading: imagesLoading } = useQuery<{ images: UserImage[] }>({
    queryKey: ['/api/user-images', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        throw new Error('No authenticated user found');
      }
      const response = await apiRequest('GET', `/api/user-images?email=${encodeURIComponent(user.email)}`);
      return response.json();
    },
    enabled: isAuthenticated && !!user?.email, // Only run query if user is authenticated
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 pt-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-gray-300 font-notosans">Loading...</p>
            </div>
          </div>
        </main>
        <Footer showTopLine={true} />
      </div>
    );
  }

  // Unauthenticated users are redirected to /create page via useEffect above

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navigation />

      <main className="flex-grow container mx-auto px-4 pt-1 pb-6 relative">


        {/* User's generated images grid */}
        {imagesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8).fill(null).map((_, index) => (
              <div key={index} className="poster-tile animate-pulse">
                <div className="relative w-full" style={{ aspectRatio: '1/1.414' }}>
                  <div className="absolute inset-0 bg-gray-800 rounded-md overflow-hidden shadow-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : userImages?.images && userImages.images.length > 0 ? (
          <>
            {/* Image modal */}
            {selectedImage && (
              <DashboardImageModal
                isOpen={!!selectedImage}
                onClose={closeImageModal}
                imageUrl={import.meta.env.VITE_API_URL + selectedImage.imageUrl}
                style={selectedImage.style}
                id={selectedImage.id}
                isPublic={selectedImage.isPublic}
                onShare={(imageUrl: string) => {
                  setShareImageUrl(imageUrl);
                  setShowShareModal(true);
                }}
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {userImages.images.map((image) => (
                image.validate && <div
                  key={image.id}
                  className="poster-tile cursor-pointer"
                  onClick={() => openImageModal(image)}
                >
                  <div className="w-full bg-black" style={{ aspectRatio: '1/1.414' }}>
                    <div className="w-full h-full relative group hover:outline hover:outline-[12px] hover:outline-white transition-all duration-300">
                      <img
                        src={import.meta.env.VITE_API_URL + image.imageUrl}
                        alt={`Poster with ${image.style} style`}
                        className="w-full h-full object-fill transition-all duration-300 select-none pointer-events-none"
                        loading="lazy"
                        style={{ userSelect: 'none' }}
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                      {image.isPublic && (
                        <div className="absolute top-2 right-2 bg-[#f1b917] text-black text-xs font-bold px-2 py-1 rounded">
                          Public
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-300 mb-2">No generated posters yet</p>
            <p className="text-gray-400 text-sm">Start creating your first poster!</p>
            <Link href="/create" className="mt-4 bg-white text-black px-6 py-2 rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200">
              Create Poster
            </Link>
          </div>
        )}
      </main>

      <Footer showTopLine={true} />



      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        imageUrl={shareImageUrl}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        email={user?.email || ""}
        onSubscriptionComplete={() => {
          setIsSubscriptionModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}