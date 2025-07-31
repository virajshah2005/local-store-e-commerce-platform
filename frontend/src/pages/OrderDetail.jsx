import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { api } from '../utils/api'
import toast from 'react-hot-toast'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Calendar,
  Hash,
  Building2
} from 'lucide-react'

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: orderData, isLoading, error } = useQuery(
    ['order', id],
    async () => {
      const response = await api.get(`/orders/${id}`)
      return response.data.order
    }
  )

  const cancelOrderMutation = useMutation(
    async () => {
      const response = await api.patch(`/orders/${id}/cancel`)
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Order cancelled successfully')
        // Refetch order data
        window.location.reload()
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to cancel order'
        toast.error(message)
      }
    }
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900'
      case 'processing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900'
      case 'shipped': return 'text-purple-600 bg-purple-100 dark:bg-purple-900'
      case 'delivered': return 'text-green-600 bg-green-100 dark:bg-green-900'
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock
      case 'processing': return Package
      case 'shipped': return Truck
      case 'delivered': return CheckCircle
      case 'cancelled': return XCircle
      default: return Clock
    }
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cod': return Truck
      case 'netbanking': return Building2
      case 'paytm': return CreditCard
      case 'phonepe': return CreditCard
      case 'paypal': return CreditCard
      case 'card': return CreditCard
      default: return CreditCard
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Order not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The order you're looking for doesn't exist</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/orders')}
              className="btn btn-primary btn-lg"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    )
  }

  const order = orderData
  let items = []
  try {
    if (typeof order.items === 'string') {
      items = JSON.parse(order.items || '[]')
    } else if (Array.isArray(order.items)) {
      items = order.items
    } else {
      items = []
    }
  } catch (error) {
    console.error('Error parsing order items:', error)
    items = []
  }
  const StatusIcon = getStatusIcon(order.status)
  const PaymentIcon = getPaymentMethodIcon(order.payment_method)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/orders')}
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-4"
        >
          ← Back to Orders
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Order #{order.order_number}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  <div className="flex items-center">
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Order Items</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        ₹{(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ₹{parseFloat(item.price || 0).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{order.customer_phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{order.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <PaymentIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {order.payment_method.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Address
                </h2>
              </div>
              <div className="card-content">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                  {order.shipping_address}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Billing Address
                </h2>
              </div>
              <div className="card-content">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                  {order.billing_address}
                </p>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Order Notes</h2>
              </div>
              <div className="card-content">
                <p className="text-gray-900 dark:text-gray-100">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <div className="card-header">
              <h2 className="card-title">Order Summary</h2>
            </div>
            <div className="card-content">
              {/* Order Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{order.order_number}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Order Date</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <StatusIcon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Breakdown */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">₹{parseFloat(order.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">CGST (9%)</span>
                  <span className="font-medium">₹{parseFloat(order.cgst_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">SGST (9%)</span>
                  <span className="font-medium">₹{parseFloat(order.sgst_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Delivery Charges</span>
                  <span className="font-medium">
                    {parseFloat(order.delivery_charges || 0) === 0 ? 'Free' : `₹${parseFloat(order.delivery_charges || 0).toFixed(2)}`}
                  </span>
                </div>
                {parseFloat(order.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                    <span className="font-medium text-green-600">-₹{parseFloat(order.discount_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {order.status === 'pending' && (
                  <button
                    onClick={() => cancelOrderMutation.mutate()}
                    disabled={cancelOrderMutation.isLoading}
                    className="w-full btn btn-outline btn-lg"
                  >
                    {cancelOrderMutation.isLoading ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full btn btn-primary btn-lg"
                >
                  Back to Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail 