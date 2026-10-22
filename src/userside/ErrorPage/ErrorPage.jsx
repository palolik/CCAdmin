import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const error = useRouteError();
  const notFound = !error || (isRouteErrorResponse(error) && error.status === 404);

  if (error && !notFound) console.error(error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-7xl font-bold text-gray-800">{notFound ? "404" : "Oops!"}</h1>
      <p className="mt-4 text-xl font-semibold text-gray-700">
        {notFound ? "Page not found" : "Something went wrong"}
      </p>
      <p className="mt-2 text-gray-500">
        {notFound
          ? "The page you are looking for doesn't exist or has been moved."
          : "Please try again in a moment."}
      </p>
      <Link to="/" className="btn btn-primary mt-8">
        Back to Home
      </Link>
    </div>
  );
};

export default ErrorPage;
