import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900">404</h1>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Seite nicht gefunden
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Die angeforderte Seite konnte nicht gefunden werden.
            </p>
            <div className="mt-6">
              <Link
                to="/dashboard"
                className="btn btn-primary inline-flex items-center"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Zurück zum Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;