import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WishlistContext = createContext(null);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  React.useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('wishlist');
        if (saved) setItems(JSON.parse(saved));
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const saveToStorage = async (newItems) => {
    await AsyncStorage.setItem('wishlist', JSON.stringify(newItems));
  };

  const toggleWishlist = useCallback((service) => {
    setItems((prev) => {
      const exists = prev.find((item) => item.id === service.id);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item.id !== service.id);
      } else {
        updated = [...prev, service];
      }
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const isInWishlist = useCallback(
    (serviceId) => items.some((item) => item.id === serviceId),
    [items],
  );

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
