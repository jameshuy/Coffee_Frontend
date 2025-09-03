interface OrderSummaryProps {
  className?: string;
}

export default function OrderSummary({ className = "" }: OrderSummaryProps) {
  const posterPrice = 29.95;
  const shippingPrice = 0.00;
  const totalPrice = posterPrice + shippingPrice;

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6 ${className}`}>
      <h3 className="text-lg font-racing-sans text-white mb-4">Order Summary</h3>
      
      <div className="space-y-3">
        {/* Poster Details */}
        <div className="flex justify-between items-center text-white">
          <span className="text-sm">A3 Poster (297 × 420 mm)</span>
          <span className="font-medium">CHF {posterPrice.toFixed(2)}</span>
        </div>
        
        {/* Shipping */}
        <div className="flex justify-between items-center text-white">
          <span className="text-sm">Shipping</span>
          <span className="font-medium">CHF {shippingPrice.toFixed(2)} <span className="text-green-400 text-xs">(Free)</span></span>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-600 my-3"></div>
        
        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-white font-racing-sans text-base">Total</span>
          <span className="text-[#f1b917] font-racing-sans text-lg font-bold">CHF {totalPrice.toFixed(2)}</span>
        </div>
        
        {/* Switzerland delivery text */}
        <div className="text-center mt-3">
          <p className="text-gray-300 text-xs">
            Printed in Switzerland 🇨🇭 Delivered to your door.
          </p>
        </div>
      </div>
    </div>
  );
}