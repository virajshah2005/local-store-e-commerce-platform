import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const currentTheme = themes.find(t => t.value === theme)
  const IconComponent = currentTheme?.icon || Sun

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <IconComponent className="w-4 h-4" />
        <span className="text-sm font-medium">{currentTheme?.label}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            {themes.map((themeOption) => {
              const ThemeIcon = themeOption.icon
              return (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    toggleTheme(themeOption.value)
                    setIsOpen(false)
                  }}
                  className={`flex items-center space-x-3 w-full px-4 py-2 text-sm transition-colors ${
                    theme === themeOption.value
                      ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <ThemeIcon className="w-4 h-4" />
                  <span>{themeOption.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeToggle 