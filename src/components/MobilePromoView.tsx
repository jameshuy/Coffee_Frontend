export default function MobilePromoView() {
    return (
        <div className="w-full flex flex-col items-center justify-center text-white py-16 mt-20">
            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-racing-sans text-white text-center mb-8 leading-tight">
                Create on Mobile
            </h1>

            {/* Description Lines */}
            <div className="flex flex-col items-center space-y-3 mb-8 text-center">
                <p className="text-lg md:text-xl text-white">
                    Turn moments into collectible prints
                </p>
                <p className="text-lg md:text-xl text-white">
                    Create for you, a friend or the café collection
                </p>
                <p className="text-lg md:text-xl text-white">
                    Get voted into cafés and earn royalties
                </p>
            </div>

            {/* Call to Action */}
            <p className="text-xl md:text-2xl font-bold font-racing-sans text-[#f1b917] mb-12 text-center">
                Join the movement!
            </p>

            {/* App Store and Google Play Buttons */}
            <div className="flex flex-row items-center justify-center gap-4">
                {/* App Store Button */}
                <a
                    href="https://apps.apple.com/"
                    className="flex items-center gap-2 bg-white px-4 py-3 rounded hover:opacity-90 transition-opacity"
                    onClick={(e) => {
                        e.preventDefault();
                        // TODO: Add actual App Store link
                        console.log('App Store clicked');
                    }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-black"
                    >
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-black leading-tight">Download on the</span>
                        <span className="text-sm font-semibold text-black leading-tight">App Store</span>
                    </div>
                </a>

                {/* Google Play Button */}
                <a
                    href="https://play.google.com/"
                    className="flex items-center gap-2 bg-white px-4 py-3 rounded hover:opacity-90 transition-opacity"
                    onClick={(e) => {
                        e.preventDefault();
                        // TODO: Add actual Google Play link
                        console.log('Google Play clicked');
                    }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-black"
                    >
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-black leading-tight">GET IT ON</span>
                        <span className="text-sm font-semibold text-black leading-tight">Google Play</span>
                    </div>
                </a>
            </div>
        </div>
    );
}

