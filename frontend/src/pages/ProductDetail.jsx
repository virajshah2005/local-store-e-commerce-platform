import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { api } from '../utils/api'
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, CheckCircle, Star as StarIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const ProductDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  // Fetch product details
  const { data: productData, isLoading, error } = useQuery(
    ['product', id],
    async () => {
      const response = await api.get(`/products/${id}`)
      return response.data.product
    },
    {
      enabled: !!id,
    }
  )

  // Add to cart mutation
  const addToCartMutation = useMutation(
    async ({ productId, quantity }) => {
      return await addToCart(productId, quantity)
    },
    {
      onSuccess: () => {
        toast.success('Added to cart successfully!')
        queryClient.invalidateQueries(['cart'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add to cart')
      }
    }
  )

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }
    addToCartMutation.mutate({ productId: id, quantity })
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-200 h-96 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  if (!productData) {
    return null
  }

  const product = productData
  const images = product.image_url ? [product.image_url] : []
  const hasSalePrice = product.sale_price && product.sale_price < product.price
  const discountPercentage = hasSalePrice ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-w-1 aspect-h-1 w-full">
            <img
              src={images[selectedImage] || 'https://via.placeholder.com/600x600?text=No+Image'}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
          {images.length > 1 && (
            <div className="flex space-x-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500">
            <ol className="flex space-x-2">
              <li><a href="/" className="hover:text-blue-600">Home</a></li>
              <li>/</li>
              <li><a href="/products" className="hover:text-blue-600">Products</a></li>
              <li>/</li>
              <li className="text-gray-900">{product.name}</li>
            </ol>
          </nav>

          {/* Product Title */}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(parseFloat(product.average_rating) || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {product.average_rating ? `${parseFloat(product.average_rating).toFixed(1)}` : 'No'} rating
            </span>
            <span className="text-sm text-gray-600">
              ({product.reviews?.length || 0} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="space-y-2">
            {hasSalePrice ? (
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-red-600">₹{product.sale_price}</span>
                <span className="text-xl text-gray-500 line-through">₹{product.price}</span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                  {discountPercentage}% OFF
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            {product.stock_quantity > 0 ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">In Stock ({product.stock_quantity} available)</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <span className="font-medium">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          {product.stock_quantity > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || addToCartMutation.isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{addToCartMutation.isLoading ? 'Adding...' : 'Add to Cart'}</span>
            </button>
            
            <div className="flex space-x-3">
              <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Wishlist</span>
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center space-x-2">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center space-x-3">
              <Truck className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Free delivery on orders above ₹500</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Secure payment</span>
            </div>
            <div className="flex items-center space-x-3">
              <RotateCcw className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Easy returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">{product.description}</p>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{review.user_name}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-gray-700">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
        )}
      </div>
    </div>
  )
}

export default ProductDetail 