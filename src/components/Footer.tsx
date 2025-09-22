import PolicyModal from "./PolicyModal";
import React from "react";

interface FooterProps {
  showTopLine?: boolean;
  transparent?: boolean;
}

export default function Footer({ showTopLine = false, transparent = false }: FooterProps) {
  return (
    <footer className={`${transparent ? 'bg-transparent' : 'bg-black'} py-4 mt-2`}>
      {showTopLine && (
        <div className="container mx-auto px-4">
          {/* Horizontal line above footer - same width as navigation lines */}
          <div className="w-full h-px bg-white mb-4"></div>
        </div>
      )}
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          {/* Footer links - moved above copyright */}
          <div className="flex flex-wrap justify-center space-x-4 md:space-x-6 tracking-wider mb-2">
            <PolicyModal 
              title="Privacy Policy" 
              triggerText={
                <span className="text-white hover:text-opacity-80 transition-all text-[10px] tracking-[0.15em]">
                  Privacy Policy
                </span>
              }
            >
              <div className="space-y-4">
                <p className="font-semibold">Effective Date: 04 May 2025</p>
                
                <p>
                  Welcome to Coffee&Prints, operated by PolyCraft SNC ("we," "our," or "us"). We are committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
                </p>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">1. Information We Collect</h3>
                  <p><span className="font-semibold">Personal Information:</span> When you place an order or contact us, we may collect your name, email address, shipping address, and payment details.</p>
                  <p><span className="font-semibold">User Content:</span> Images you upload for artistic poster transformation.</p>
                  <p><span className="font-semibold">Usage Data:</span> We collect non-identifiable data such as browser type, access times, and pages visited.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">2. How We Use Your Information</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>To process transactions and deliver orders.</li>
                    <li>To communicate with you about your order or inquiries.</li>
                    <li>To improve our products, services, and website.</li>
                    <li>To prevent fraud and ensure legal compliance.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">3. Data Sharing</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>We do not sell your data.</li>
                    <li>We may share your data with third-party services essential to our operations (e.g., payment processors, printing services), all under strict confidentiality agreements.</li>
                    <li>We may disclose your information if required by law.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">4. Data Retention</h3>
                  <p>We retain your data as long as necessary to fulfill the purposes outlined in this policy, including legal or operational requirements.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">5. Your Rights</h3>
                  <p>You have the right to access, correct, or delete your personal data.</p>
                  <p>You may contact us at info@polycraft-studios.com to exercise these rights.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">6. Security</h3>
                  <p>We implement appropriate security measures to protect your information. However, no internet-based system is 100% secure.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">7. Changes to This Policy</h3>
                  <p>We may update this Privacy Policy. Changes will be posted on this page with the updated effective date.</p>
                </div>
              </div>
            </PolicyModal>
            
            <PolicyModal 
              title="Terms of Service" 
              triggerText={
                <span className="text-white hover:text-opacity-80 transition-all text-[10px] tracking-[0.15em] opacity-70">
                  Terms of Service
                </span>
              }
            >
              <div className="space-y-4">
                <p className="font-semibold">Effective Date: 04 May 2025</p>
                
                <p>
                  By using the Coffee&Prints website, operated by PolyCraft SNC, you agree to the following terms:
                </p>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">1. Use of the Site</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You must be at least 18 years old or have permission from a legal guardian.</li>
                    <li>You agree not to use the site for illegal or unauthorized purposes.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">2. User Content</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>By uploading images, you affirm that you own or have rights to the content.</li>
                    <li>You grant us a non-exclusive, royalty-free license to use the uploaded content to produce the ordered poster and for internal quality improvement.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">3. Orders and Payment</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>All prices are listed in CHF and include applicable taxes.</li>
                    <li>Orders are processed upon payment. Cancellations are not possible after production has started.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">4. Shipping and Returns</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>We ship via Swiss Post or other carriers. Estimated delivery times are provided at checkout.</li>
                    <li>As each product is made to order, returns are only accepted for defective or damaged items.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">5. Intellectual Property</h3>
                  <p>All content on our website and generated designs (excluding user-uploaded material) are the property of PolyCraft SNC.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">6. Limitation of Liability</h3>
                  <p>We are not liable for indirect damages or loss resulting from your use of our services.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">7. Governing Law</h3>
                  <p>These terms are governed by Swiss law. Any disputes shall be resolved under the jurisdiction of the courts of Lugano, Switzerland.</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mt-4 mb-2">8. Contact</h3>
                  <p>For any questions or concerns, contact us at info@polycraft-studios.com</p>
                </div>
              </div>
            </PolicyModal>
            
            <a href="mailto:info@polycraft-studios.com" className="text-white hover:text-opacity-80 transition-all text-[10px] tracking-[0.15em] opacity-70">
              Contact
            </a>
          </div>
          
          {/* Footer text - moved below links */}
          <div className="text-white text-[8px] text-center opacity-60">
            &copy; 2025 PolyCraft SNC. All Rights Reserved. Made in 🇨🇭
          </div>
        </div>
      </div>
    </footer>
  );
}