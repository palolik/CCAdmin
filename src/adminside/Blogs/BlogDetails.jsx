import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base_url } from "../../config/config";
import BlogJsxRenderer from "./BlogJsxRenderer";
import { ShimmerDetail } from "../../userside/utils/Shimmer.jsx";

const BlogDetails = () => {
  const { slug } = useParams();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${base_url}/blogdetails-admin/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) {
          setBlog(null);
        } else {
          setBlog(data);
        }
      })
      .catch((error) => console.error("Error fetching blog:", error))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white px-4 py-8 sm:px-8">
        <ShimmerDetail sidebar={false} className="mx-auto max-w-4xl" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Blog not found.
      </div>
    );
  }

  return (
 
  <div className="w-full min-h-screen bg-white overflow-x-hidden">
    <BlogJsxRenderer blog={blog} />
  </div>

  );
};

export default BlogDetails;