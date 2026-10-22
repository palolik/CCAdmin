import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base_url } from "../../config/config";
import { ShimmerGrid } from "../../userside/utils/Shimmer.jsx";

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${base_url}/blogs`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBlogs(data);
        } else {
          setBlogs(data.blogs || []);
        }
      })
      .catch((error) => console.error("Error fetching blogs:", error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 py-14">
        <div className="text-center mb-12">
          <p className="text-blue-500 tracking-[4px] uppercase text-xs font-semibold">
            Cloud Company Blog
          </p>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4">
            Latest Articles & Updates
          </h1>

          <p className="text-gray-500 max-w-2xl mx-auto mt-4">
            Read our latest thoughts, guides, updates, and digital business
            insights.
          </p>
        </div>

        {loading ? (
          <ShimmerGrid
            count={6}
            cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            gap="gap-8"
            card={{ imageClass: "h-56" }}
          />
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No blogs published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                to={`/blog/${blog.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300"
              >
                <div className="w-full h-56 overflow-hidden bg-gray-100">
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                      {blog.author || "Cloud Company"}
                    </span>

                    <span className="text-xs text-gray-400">
                      {blog.views || 0} views
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {blog.title}
                  </h2>

                  <p className="text-gray-500 text-sm mt-3 line-clamp-3">
                    {blog.shortDescription}
                  </p>

                  <div className="mt-5 text-blue-600 text-sm font-semibold">
                    Read More →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;