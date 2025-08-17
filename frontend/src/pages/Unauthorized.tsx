import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const Unauthorized: React.FC = () => {
  const location = useLocation();
  const state = location.state as { message?: string; from?: Location } | null;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Zugriff verweigert
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {state?.message || 'Sie haben keine Berechtigung für diese Seite.'}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.history.back()}
                className="btn btn-secondary inline-flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Zurück
              </button>
              <Link
                to="/dashboard"
                className="btn btn-primary inline-flex items-center"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Zum Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;