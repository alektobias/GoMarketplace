import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (!storedProducts) return setProducts([]);
      return setProducts(JSON.parse(storedProducts));
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function storeProducts(): Promise<void> {
      try {
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      } catch (err) {
        console.log(err);
      }
    }

    storeProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      setProducts([...products, { ...product, quantity: 1 }]);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      const newProducts = [...products];

      newProducts[productIndex] = {
        ...products[productIndex],
        quantity: products[productIndex].quantity + 1,
      };

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      const newProducts = [...products];

      if (products[productIndex].quantity - 1 === 0) {
        newProducts.splice(productIndex, 1);
        return setProducts(newProducts);
      }
      newProducts[productIndex] = {
        ...products[productIndex],
        quantity: products[productIndex].quantity - 1,
      };

      return setProducts(newProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
