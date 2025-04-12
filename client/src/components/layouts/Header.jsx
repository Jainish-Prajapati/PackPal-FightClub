import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { BiBell, BiMenu, BiUser, BiLogOut, BiCog } from 'react-icons/bi';

const Header = ({ setSidebarOpen }) => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button
              type="button"
              className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <BiMenu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <span className="text-gray-900 font-medium">
                Welcome, {currentUser?.firstName}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">View notifications</span>
              <BiBell className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="ml-3 relative">
              <div>
                <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
                  </div>
                </Menu.Button>
              </div>
              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`${active ? 'bg-gray-100' : ''} flex px-4 py-2 text-sm text-gray-700 w-full`}
                      >
                        <BiUser className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Your Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={`${active ? 'bg-gray-100' : ''} flex px-4 py-2 text-sm text-gray-700 w-full`}
                      >
                        <BiCog className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`${active ? 'bg-gray-100' : ''} flex px-4 py-2 text-sm text-gray-700 w-full`}
                      >
                        <BiLogOut className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 