import { Link } from "wouter";

export default function Privacy() {
    return (
        <div className="flex justify-center py-16">
            <div className="max-w-2xl max-h-[80vh] overflow-y-auto px-8 py-5">
                <Link href="/" className="text-sm text-white opacity-80 inline-block mb-4">← Back to Home</Link>
                <div className="text-xl font-bold mb-4 text-white">
                    Privacy Policy
                </div>
                <div className="space-y-4 text-white opacity-80">
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
            </div>
        </div>
    )
}