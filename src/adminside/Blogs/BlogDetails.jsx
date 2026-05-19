import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base_url } from "../../config/config";
import BlogJsxRenderer from "./BlogJsxRenderer";

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
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading blog...
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