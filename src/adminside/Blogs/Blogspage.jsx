import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base_url } from "../../config/config";
import BlogJsxRenderer from "./BlogJSxRenderer";

const BlogsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [activeBlog, setActiveBlog] = useState(null);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingActive, setLoadingActive] = useState(false);

  useEffect(() => {
    fetch(`${base_url}/publicblogs`)
      .then((res) => res.json())
      .then((data) => {
        const blogList = Array.isArray(data) ? data : data.blogs || [];
        setBlogs(blogList);

        if (!slug && blogList.length > 0) {
          navigate(`/blogs/${blogList[0].slug}`, { replace: true });
        }
      })
      .catch((error) => console.error("Error fetching blogs:", error))
      .finally(() => setLoadingBlogs(false));
  }, []);

  useEffect(() => {
    if (!slug) return;

    setLoadingActive(true);

    fetch(`${base_url}/blogdetails/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) {
          setActiveBlog(null);
        } else {
          setActiveBlog(data);
        }
      })
      .catch((error) => console.error("Error fetching active blog:", error))
      .finally(() => setLoadingActive(false));
  }, [slug]);

  const sortedBlogs = useMemo(() => {
    return [...blogs].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [blogs]);

  if (loadingBlogs) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading blogs...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-blue-500 tracking-[4px] uppercase text-xs font-semibold">
            Cloud Company Blog
          </p>

          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mt-3">
            Latest Articles & Updates
          </h1>

          <p className="text-gray-500 mt-3 max-w-2xl">
            Read our latest guides, updates, insights, and business growth
            resources.
          </p>
        </div>

        {/* IMPORTANT: left side is minmax(0,1fr), right side fixed */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start w-full">
          {/* Open Blog */}
          <div className="w-full min-w-0">
            {loadingActive ? (
              <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm py-24 text-center text-gray-400">
                Opening blog...
              </div>
            ) : activeBlog ? (
              <BlogJsxRenderer blog={activeBlog} />
            ) : (
              <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm py-24 text-center text-red-500">
                Blog not found.
              </div>
            )}
          </div>

          {/* Right Blog List */}
          <aside className="w-full xl:w-[360px] xl:sticky xl:top-6 xl:flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">All Blogs</h2>

                <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-semibold">
                  {sortedBlogs.length}
                </span>
              </div>

              <div className="max-h-[calc(100vh-160px)] overflow-y-auto">
                {sortedBlogs.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">
                    No published blogs.
                  </div>
                ) : (
                  sortedBlogs.map((blog) => {
                    const isActive = blog.slug === slug;

                    return (
                      <button
                        key={blog._id}
                        type="button"
                        onClick={() => navigate(`/blogs/${blog.slug}`)}
                        className={`w-full text-left p-4 border-b border-gray-100 transition-all ${
                          isActive ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex gap-3">
                          <img
                            src={blog.coverImage}
                            alt={blog.title}
                            className="w-20 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                          />

                          <div className="min-w-0">
                            <h3
                              className={`text-sm font-semibold line-clamp-2 ${
                                isActive ? "text-blue-700" : "text-gray-900"
                              }`}
                            >
                              {blog.title}
                            </h3>

                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                              {blog.shortDescription}
                            </p>

                            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                              <span>{blog.author || "Cloud Company"}</span>
                              <span>•</span>
                              <span>{blog.views || 0} views</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogsPage;