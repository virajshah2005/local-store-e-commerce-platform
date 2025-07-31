import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useSearchParams } from 'react-router-dom'
import { api } from '../utils/api'
import { useCart } from '../contexts/CartContext'
import { ShoppingCart, Star, Filter, Search, Grid, List } from 'lucide-react'

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid')
  const { addToCart } = useCart()

  // Get current filters from URL
  const currentPage = parseInt(searchParams.get('page')) || 1
  const currentCategory = searchParams.get('category') || ''
  const currentSearch = searchParams.get('search') || ''
  const currentMinPrice = searchParams.get('minPrice') || ''
  const currentMaxPrice = searchParams.get('maxPrice') || ''
  const currentSort = searchParams.get('sort') || 'created_at'
  const currentOrder = searchParams.get('order') || 'desc'

  // Fetch products
  const { data: productsData, isLoading } = useQuery(
    ['products', currentPage, currentCategory, currentSearch, currentMinPrice, currentMaxPrice, currentSort, currentOrder],
    async () => {
      const params = new URLSearchParams({
        page: currentPage,
        category: currentCategory,
        search: currentSearch,
        minPrice: currentMinPrice,
        maxPrice: currentMaxPrice,
        sort: currentSort,
        order: currentOrder,
      })
      const response = await api.get(`/products?${params}`)
      return response.data
    }
  )

  // Fetch categories
  const { data: categoriesData } = useQuery(
    ['categories'],
    async () => {
      const response = await api.get('/products/categories/all')
      return response.data.categories
    }
  )

  const handleFilterChange = (key, value) => {
    const newSearchParams = new URLSearchParams(searchParams)
    if (value) {
      newSearchParams.set(key, value)
    } else {
      newSearchParams.delete(key)
    }
    newSearchParams.set('page', '1') // Reset to first page when filtering
    setSearchParams(newSearchParams)
  }

  const handlePageChange = (page) => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('page', page.toString())
    setSearchParams(newSearchParams)
  }

  const handleAddToCart = (product) => {
    addToCart(product, 1)
  }

  const products = productsData?.products || []
  const pagination = productsData?.pagination
  const categories = categoriesData || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
        <p className="text-gray-600">Browse our wide selection of products</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={currentSearch}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={currentCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Price
            </label>
            <input
              type="number"
              placeholder="Min"
              value={currentMinPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="input"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Price
            </label>
            <input
              type="number"
              placeholder="Max"
              value={currentMaxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="input"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={`${currentSort}-${currentOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-')
                handleFilterChange('sort', sort)
                handleFilterChange('order', order)
              }}
              className="input"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low to High</option>
              <option value="price-desc">Price High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {pagination?.total || 0} products found
        </p>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {products.map((product) => (
              <div key={product.id} className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                viewMode === 'list' ? 'flex' : ''
              }`}>
                <div className={`${viewMode === 'list' ? 'w-48' : ''}`}>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                      viewMode === 'list' ? 'w-full h-32' : 'w-full h-48'
                    }`}
                  />
                </div>
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                  {viewMode === 'list' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={`star-${i}`}
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
                    <a
                      href={`/products/${product.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Previous
                </button>
                
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1
                  const isCurrent = page === pagination.page
                  const isNearCurrent = Math.abs(page - pagination.page) <= 2
                  
                  if (isNearCurrent || page === 1 || page === pagination.totalPages) {
                    return (
                      <button
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page)}
                        className={`btn btn-sm ${
                          isCurrent ? 'btn-primary' : 'btn-outline'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === 2 || page === pagination.totalPages - 1) {
                    return <span key={`ellipsis-${page}`} className="px-2">...</span>
                  }
                  return null
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Products 