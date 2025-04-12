import React from 'react';

const ItemCategoryTabs = ({ categories, activeCategory, setActiveCategory }) => {
  return (
    <div className="border-b border-gray-200 mb-4">
      <nav className="flex -mb-px overflow-x-auto">
        <button
          onClick={() => setActiveCategory(null)}
          className={`py-2 px-4 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
            activeCategory === null
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All Items
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
              activeCategory === category.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {category.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ItemCategoryTabs; 