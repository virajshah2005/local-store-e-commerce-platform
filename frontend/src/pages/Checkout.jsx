import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { api } from '../utils/api'
import toast from 'react-hot-toast'
import { 
  CreditCard, 
  Truck, 
  Wallet, 
  Smartphone, 
  Building2, 
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  User
} from 'lucide-react'

const Checkout = () => {
  const { cart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    shippingAddress: user?.address || '',
    billingAddress: user?.address || '',
    paymentMethod: 'cod',
    notes: ''
  })

  const [sameAsShipping, setSameAsShipping] = useState(true)

  // Calculate billing details
  const subtotal = cart.subtotal || 0
  const cgstRate = 0.09 // 9% CGST
  const sgstRate = 0.09 // 9% SGST
  const cgstAmount = subtotal * cgstRate
  const sgstAmount = subtotal * sgstRate
  const deliveryCharges = subtotal > 500 ? 0 : 50 // Free delivery above ₹500
  const discountAmount = 0 // Can be calculated based on coupons
  const totalAmount = subtotal + cgstAmount + sgstAmount + deliveryCharges - discountAmount

  const paymentMethods = [
    { id: 'cod', name: 'Cash on Delivery', icon: Truck, description: 'Pay when you receive' },
    { id: 'netbanking', name: 'Net Banking', icon: Building2, description: 'Pay via net banking' },
    { id: 'paytm', name: 'Paytm', icon: Smartphone, description: 'Pay via Paytm wallet' },
    { id: 'phonepe', name: 'PhonePe', icon: Smartphone, description: 'Pay via PhonePe' },
    { id: 'paypal', name: 'PayPal', icon: CreditCard, description: 'Pay via PayPal' },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Pay via card' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'shippingAddress' && sameAsShipping) {
      setFormData(prev => ({
        ...prev,
        billingAddress: value
      }))
    }
  }

  const createOrderMutation = useMutation(
    async (orderData) => {
      const response = await api.post('/orders', orderData)
      return response.data
    },
    {
      onSuccess: (data) => {
        toast.success('Order placed successfully!')
        navigate(`/orders/${data.order.id}`)
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to place order'
        toast.error(message)
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.customerName || !formData.customerPhone || !formData.customerEmail || 
        !formData.shippingAddress || !formData.billingAddress) {
      toast.error('Please fill all required fields')
      return
    }

    const orderData = {
      ...formData,
      subtotal,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      delivery_charges: deliveryCharges,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      items: cart.items
    }

    createOrderMutation.mutate(orderData)
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Your cart is empty</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Add some items to your cart to checkout</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/products')}
              className="btn btn-primary btn-lg"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Checkout</h1>
        <p className="text-gray-600 dark:text-gray-400">Complete your order</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </h2>
            </div>
            <div className="card-content space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Shipping Address
              </h2>
            </div>
            <div className="card-content">
              <textarea
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                rows={4}
                className="input"
                placeholder="Enter your complete shipping address"
                required
              />
            </div>
          </div>

          {/* Billing Address */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Billing Address
              </h2>
            </div>
            <div className="card-content space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => {
                    setSameAsShipping(e.target.checked)
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        billingAddress: prev.shippingAddress
                      }))
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Same as shipping address
                </span>
              </label>
              {!sameAsShipping && (
                <textarea
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  rows={4}
                  className="input"
                  placeholder="Enter your complete billing address"
                  required
                />
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Method
              </h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={formData.paymentMethod === method.id}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <method.icon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {method.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {method.description}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Order Notes</h2>
            </div>
            <div className="card-content">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="input"
                placeholder="Any special instructions for your order?"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <div className="card-header">
              <h2 className="card-title">Order Summary</h2>
            </div>
            <div className="card-content">
              {/* Order Items */}
              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id || item.product_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ₹{(parseFloat(item.sale_price || item.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Billing Breakdown */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">CGST (9%)</span>
                  <span className="font-medium">₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">SGST (9%)</span>
                  <span className="font-medium">₹{sgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Delivery Charges</span>
                  <span className="font-medium">
                    {deliveryCharges === 0 ? 'Free' : `₹${deliveryCharges.toFixed(2)}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                    <span className="font-medium text-green-600">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={createOrderMutation.isLoading}
                className="w-full btn btn-primary btn-lg mt-6"
              >
                {createOrderMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Place Order - ₹${parseFloat(totalAmount || 0).toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Checkout 