import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define cart item structure
export interface CartItem {
  id: string;
  imageUrl: string; // Thumbnail URL for display in cart
  fullImageUrl: string; // Full-quality URL for orders/printing
  style: string;
  price: number;
  quantity: number;
  isLimitedEdition?: boolean; // Track if item is limited edition
}

// Define cart context properties
interface CartContextProps {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  cartTotal: number;
}

// Create context with default values
const CartContext = createContext<CartContextProps>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isInCart: () => false,
  cartTotal: 0,
});

// Create provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Add item to cart
  const addToCart = (item: CartItem) => {
    // Check if item already exists in cart
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      // If item exists, increase quantity
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      // If item doesn't exist, add it with quantity 1
      setCartItems([...cartItems, { ...item, quantity: item.quantity || 1 }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Update quantity of an item (prevents changes for limited edition items)
  const updateQuantity = (id: string, quantity: number) => {
    const item = cartItems.find(item => item.id === id);
    
    // Prevent quantity changes for limited edition items
    if (item?.isLimitedEdition) {
      return;
    }
    
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Check if item is in cart
  const isInCart = (id: string) => {
    return cartItems.some(item => item.id === id);
  };

  // Calculate cart total based on item price and quantity
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook for using cart context
export function useCart() {
  return useContext(CartContext);
}