import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, clearCart, isLoading } = useCart()
  const { isAuthenticated } = useAuth()

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return
    updateCartItem(itemId, newQuantity)
  }

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId)
  }

  const handleClearCart = () => {
    clearCart()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-gray-600">Start shopping to add items to your cart</p>
          <div className="mt-6">
            <Link
              to="/products"
              className="btn btn-primary btn-lg"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-600">{cart.totalItems} items in your cart</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Cart Items</h2>
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear Cart
                </button>
              </div>
            </div>
            <div className="divide-y">
              {cart.items.map((item) => (
                <div key={item.id || item.product_id} className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Stock: {item.stock_quantity} available
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.id || item.product_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id || item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock_quantity}
                            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary-600">
                            ₹{(parseFloat(item.sale_price || item.price || 0) * item.quantity).toFixed(2)}
                          </p>
                          {item.sale_price && (
                            <p className="text-sm text-gray-500 line-through">
                              ₹{(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id || item.product_id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{parseFloat(cart.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary-600">
                    ₹{parseFloat(cart.subtotal || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {isAuthenticated ? (
                <Link
                  to="/checkout"
                  className="w-full btn btn-primary btn-lg"
                >
                  Proceed to Checkout
                </Link>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">
                    Please sign in to checkout
                  </p>
                  <Link
                    to="/login"
                    className="w-full btn btn-primary btn-lg"
                  >
                    Sign In to Checkout
                  </Link>
                </div>
              )}
              <Link
                to="/products"
                className="w-full btn btn-outline btn-lg"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart 