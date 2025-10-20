import { Link } from "wouter";

export default function Terms() {
    return (
        <div className="flex justify-center py-16">
            <div className="max-w-2xl max-h-[80vh] overflow-y-auto px-8 py-5">
                <Link href="/" className="text-sm text-white opacity-80 inline-block mb-4">← Back to Home</Link>
                <div className="text-xl font-bold mb-4 text-white">
                    Terms of Service
                </div>
                <div className="space-y-4 text-white opacity-80">
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
            </div>
        </div>
    )
}