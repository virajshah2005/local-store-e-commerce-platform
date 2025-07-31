import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { ShoppingCart, Star, ArrowRight, Truck, Shield, Clock, User, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const Home = () => {
  const { addToCart } = useCart()
  const { isAuthenticated, user } = useAuth()

  // Fetch featured products
  const { data: featuredProducts, isLoading: productsLoading } = useQuery(
    ['featured-products'],
    async () => {
      const response = await api.get('/products/featured')
      return response.data.products
    }
  )

  // Fetch categories
  const { data: categories } = useQuery(
    ['categories'],
    async () => {
      const response = await api.get('/products/categories/all')
      return response.data.categories
    }
  )

  const handleAddToCart = (product) => {
    addToCart(product, 1)
  }

  const features = [
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Free shipping on orders over $50'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure payment processing'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round the clock customer support'
    }
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {isAuthenticated ? (
              <>
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  Welcome back, <span className="text-secondary-300">{user?.name}</span>!
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                  Ready to discover more amazing products?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/products"
                    className="btn btn-secondary btn-lg inline-flex items-center"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/profile"
                    className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary-600 inline-flex items-center"
                  >
                    <User className="mr-2 w-5 h-5" />
                    My Profile
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  Welcome to <span className="text-secondary-300">Local Store</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                  Discover amazing products at your neighborhood store
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/products"
                    className="btn btn-secondary btn-lg inline-flex items-center"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary-600"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* User Stats Section (for logged-in users) */}
      {isAuthenticated && (
        <section className="py-8 bg-primary-50 dark:bg-primary-900/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Account Status</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(user?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quick Actions</p>
                    <Link to="/orders" className="text-lg font-semibold text-primary-600 hover:text-primary-700">
                      View Orders
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Shop by Category</h2>
              <p className="text-gray-600 dark:text-gray-400">Browse our wide selection of products</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="group"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                      <span className="text-2xl font-bold text-primary-600">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Featured Products</h2>
            <p className="text-gray-600 dark:text-gray-400">Handpicked products just for you</p>
          </div>

          {productsLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.map((product) => (
                <div key={product.id} className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={`home-star-${i}`}
                              className={`w-4 h-4 ${
                                i < Math.floor(parseFloat(product.average_rating) || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-2">
                          {product.average_rating ? `${parseFloat(product.average_rating).toFixed(1)}` : 'No'} rating
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {product.sale_price ? (
                            <>
                              <span className="text-lg font-bold text-primary-600">
                                ₹{product.sale_price}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                ₹{product.price}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-primary-600">
                              ₹{product.price}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {product.stock_quantity} left
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 btn btn-primary btn-sm inline-flex items-center justify-center"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </button>
                        <Link
                          to={`/products/${product.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/products"
              className="btn btn-primary btn-lg inline-flex items-center"
            >
              View All Products
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of satisfied customers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn btn-secondary btn-lg"
            >
              Create Account
            </Link>
            <Link
              to="/products"
              className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary-600"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home 