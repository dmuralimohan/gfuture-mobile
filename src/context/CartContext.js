import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('cart');
        if (saved) setItems(JSON.parse(saved));
      } catch (e) {
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const saveToStorage = async (newItems) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    } catch (e) {
      // ignore
    }
  };

  const addItem = useCallback((service, selectedSize = null) => {
    setItems((prev) => {
      const key = `${service.id}-${selectedSize || 'default'}`;
      const exists = prev.find((item) => item.cartKey === key);
      let updated;
      if (exists) {
        updated = prev.map((item) =>
          item.cartKey === key ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else {
        updated = [
          ...prev,
          { ...service, cartKey: key, quantity: 1, selectedSize },
        ];
      }
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((cartKey) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.cartKey !== cartKey);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback(
    (cartKey, quantity) => {
      if (quantity <= 0) {
        removeItem(cartKey);
        return;
      }
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity } : item,
        );
        saveToStorage(updated);
        return updated;
      });
    },
    [removeItem],
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    await AsyncStorage.removeItem('cart');
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const platformFee = useMemo(
    () => Math.round(subtotal * 0.0102 * 100) / 100,
    [subtotal],
  );

  const deliveryFee = useMemo(() => (subtotal > 500 ? 0 : 49), [subtotal]);

  const total = useMemo(
    () => subtotal + platformFee + deliveryFee,
    [subtotal, platformFee, deliveryFee],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loaded,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        platformFee,
        deliveryFee,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
