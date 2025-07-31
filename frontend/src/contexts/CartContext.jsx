import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../utils/api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [localCart, setLocalCart] = useState(() => {
    const saved = localStorage.getItem('localCart')
    return saved ? JSON.parse(saved) : []
  })

  // Sync local cart to server when user logs in
  const syncLocalCartMutation = useMutation(
    async (localCartItems) => {
      const promises = localCartItems.map(item =>
        api.post('/cart/add', { 
          product_id: item.product_id, 
          quantity: item.quantity 
        })
      )
      await Promise.all(promises)
    },
    {
      onSuccess: () => {
        // Clear local cart after successful sync
        setLocalCart([])
        localStorage.removeItem('localCart')
        queryClient.invalidateQueries(['cart'])
        queryClient.invalidateQueries(['cart-count'])
        toast.success('Cart synced to your account!')
      },
      onError: (error) => {
        console.error('Failed to sync cart:', error)
      }
    }
  )

  // Fetch cart from server if authenticated
  const { data: serverCart, isLoading } = useQuery(
    ['cart'],
    async () => {
      const response = await api.get('/cart')
      return response.data
    },
    {
      enabled: isAuthenticated,
      retry: false,
      onError: () => {
        // Handle error silently
      },
      onSuccess: () => {
        // Sync local cart to server if user has local cart items
        if (localCart.length > 0) {
          syncLocalCartMutation.mutate(localCart)
        }
      }
    }
  )

  // Get cart count
  const { data: cartCount } = useQuery(
    ['cart-count'],
    async () => {
      const response = await api.get('/cart/count')
      return response.data.count
    },
    {
      enabled: isAuthenticated,
      retry: false,
      onError: () => {
        return 0
      }
    }
  )

  // Add to cart mutation
  const addToCartMutation = useMutation(
    async ({ productId, quantity }) => {
      const response = await api.post('/cart/add', { product_id: productId, quantity })
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['cart'])
        queryClient.invalidateQueries(['cart-count'])
        toast.success('Added to cart!')
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to add to cart'
        toast.error(message)
      }
    }
  )

  // Update cart item mutation
  const updateCartItemMutation = useMutation(
    async ({ itemId, quantity }) => {
      const response = await api.put(`/cart/update/${itemId}`, { quantity })
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['cart'])
        queryClient.invalidateQueries(['cart-count'])
        toast.success('Cart updated!')
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to update cart'
        toast.error(message)
      }
    }
  )

  // Remove from cart mutation
  const removeFromCartMutation = useMutation(
    async (itemId) => {
      const response = await api.delete(`/cart/remove/${itemId}`)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['cart'])
        queryClient.invalidateQueries(['cart-count'])
        toast.success('Item removed from cart!')
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to remove item'
        toast.error(message)
      }
    }
  )

  // Clear cart mutation
  const clearCartMutation = useMutation(
    async () => {
      const response = await api.delete('/cart/clear')
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['cart'])
        queryClient.invalidateQueries(['cart-count'])
        toast.success('Cart cleared!')
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to clear cart'
        toast.error(message)
      }
    }
  )

  // Local cart operations for non-authenticated users
  const addToLocalCart = (product, quantity = 1) => {
    setLocalCart(prev => {
      const existingItem = prev.find(item => item.product_id === product.id)
      const newCart = existingItem
        ? prev.map(item =>
            item.product_id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...prev, {
            product_id: product.id,
            quantity,
            name: product.name,
            price: product.sale_price || product.price,
            image_url: product.image_url,
            stock_quantity: product.stock_quantity
          }]
      
      // Save to localStorage
      localStorage.setItem('localCart', JSON.stringify(newCart))
      return newCart
    })
    toast.success('Added to cart!')
  }

  const updateLocalCartItem = (productId, quantity) => {
    setLocalCart(prev => {
      const newCart = prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      )
      localStorage.setItem('localCart', JSON.stringify(newCart))
      return newCart
    })
    toast.success('Cart updated!')
  }

  const removeFromLocalCart = (productId) => {
    setLocalCart(prev => {
      const newCart = prev.filter(item => item.product_id !== productId)
      localStorage.setItem('localCart', JSON.stringify(newCart))
      return newCart
    })
    toast.success('Item removed from cart!')
  }

  const clearLocalCart = () => {
    setLocalCart([])
    localStorage.removeItem('localCart')
    toast.success('Cart cleared!')
  }

  // Get current cart data
  const getCartData = () => {
    if (isAuthenticated) {
      return serverCart || { items: [], subtotal: 0, totalItems: 0 }
    } else {
      const items = localCart
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
      return { items, subtotal, totalItems }
    }
  }

  // Add to cart function
  const addToCart = (product, quantity = 1) => {
    if (isAuthenticated) {
      addToCartMutation.mutate({ productId: product.id, quantity })
    } else {
      addToLocalCart(product, quantity)
    }
  }

  // Update cart item function
  const updateCartItem = (itemId, quantity) => {
    if (isAuthenticated) {
      updateCartItemMutation.mutate({ itemId, quantity })
    } else {
      updateLocalCartItem(itemId, quantity)
    }
  }

  // Remove from cart function
  const removeFromCart = (itemId) => {
    if (isAuthenticated) {
      removeFromCartMutation.mutate(itemId)
    } else {
      removeFromLocalCart(itemId)
    }
  }

  // Clear cart function
  const clearCart = () => {
    if (isAuthenticated) {
      clearCartMutation.mutate()
    } else {
      clearLocalCart()
    }
  }

  // Get cart count
  const getCartCount = () => {
    if (isAuthenticated) {
      return cartCount || 0
    } else {
      return localCart.reduce((sum, item) => sum + item.quantity, 0)
    }
  }

  const value = {
    cart: getCartData(),
    cartCount: getCartCount(),
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    isAuthenticated
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
} 