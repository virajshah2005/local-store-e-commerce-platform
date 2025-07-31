import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { Package, Calendar, DollarSign, Eye } from 'lucide-react'

const Orders = () => {
  const { data: ordersData, isLoading, error } = useQuery(
    ['orders'],
    async () => {
      const response = await api.get('/orders/my-orders')
      return response.data.orders
    }
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'processing':
        return '⚙️'
      case 'shipped':
        return '📦'
      case 'delivered':
        return '✅'
      case 'cancelled':
        return '❌'
      default:
        return '📋'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Orders</h2>
          <p className="text-gray-600 dark:text-gray-400">Failed to load your orders. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">My Orders</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your order history and current orders</p>
      </div>

      {!ordersData || ordersData.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Orders Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't placed any orders yet.</p>
          <Link
            to="/products"
            className="btn btn-primary"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {ordersData.map((order) => (
            <div key={order.id} className="card">
              <div className="card-content">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      <span className="mr-1">{getStatusIcon(order.status)}</span>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn btn-outline btn-sm inline-flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Items:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{order.item_count || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-medium text-gray-900 dark:text-white">₹{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      Your order is being processed. We'll notify you once it's ready to ship.
                    </p>
                  </div>
                )}

                {order.status === 'shipped' && (
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-300">
                      Your order has been shipped! Track your package for delivery updates.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders 