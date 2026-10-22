import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
import { ShimmerTable } from "../../userside/utils/Shimmer.jsx";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  // loading starts true, so only the first load shows the shimmer;
  // refetches after create keep the current rows on screen.
  const fetchBlogs = () => {
    fetch(`${base_url}/blogs`)
      .then((res) => res.json())
      .then((data) => {
        // supports both: array response OR { blogs: [] }
        if (Array.isArray(data)) {
          setBlogs(data);
        } else {
          setBlogs(data.blogs || []);
        }
      })
      .catch((error) => console.error("Error fetching blogs:", error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverPreview(null);
    }
  };

  const handleBlogImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
  };

  const handleAddBlog = async (event) => {
    event.preventDefault();

    const form = event.target;

    const title = form.title.value.trim();
    const shortDescription = form.shortDescription.value.trim();
    const author = form.author.value.trim();
    const status = form.status.value;
    const tagsText = form.tags.value.trim();

    const coverImage = form.coverImage.files[0];
    const jsxFile = form.jsxFile.files[0];
    const blogImages = Array.from(form.blogImages.files || []);

    if (!title || !shortDescription || !coverImage || !jsxFile) {
      Swal.fire(
        "Missing Fields",
        "Title, short description, cover image, and JSX file are required.",
        "warning"
      );
      return;
    }

    const tags = tagsText
      ? tagsText.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

    const formData = new FormData();

    formData.append("title", title);
    formData.append("shortDescription", shortDescription);
    formData.append("author", author || "Cloud Company");
    formData.append("status", status);
    formData.append("tags", JSON.stringify(tags));
    formData.append("coverImage", coverImage);
    formData.append("jsxFile", jsxFile);

    blogImages.forEach((image) => {
      formData.append("blogImages", image);
    });

    try {
      const response = await fetch(`${base_url}/addblog`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success || data.insertedId) {
        Swal.fire("Blog Added!", "Blog uploaded successfully.", "success");

        form.reset();
        setCoverPreview(null);
        setSelectedImages([]);
        setShowForm(false);

        if (data.blog) {
          setBlogs((prev) => [data.blog, ...prev]);
        } else {
          fetchBlogs();
        }
      } else {
        Swal.fire("Error!", data.message || "Failed to add blog.", "error");
      }
    } catch (error) {
      console.error("Error adding blog:", error);
      Swal.fire("Error!", "Unexpected error occurred.", "error");
    }
  };

  const handleDelete = (_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This blog will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/delblog/${_id}`, {
          method: "DELETE",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "Blog deleted successfully.", "success");
              setBlogs((prev) => prev.filter((blog) => blog._id !== _id));
            } else {
              Swal.fire("Error!", "Failed to delete blog.", "error");
            }
          })
          .catch((error) => {
            console.error("Error deleting blog:", error);
            Swal.fire("Error!", "Unexpected error occurred.", "error");
          });
      }
    });
  };

  const handleStatusChange = async (_id, newStatus) => {
    try {
      const response = await fetch(`${base_url}/blogstatus/${_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.modifiedCount > 0 || data.acknowledged) {
        setBlogs((prev) =>
          prev.map((blog) =>
            blog._id === _id
              ? { ...blog, status: newStatus }
              : blog
          )
        );

        Swal.fire({
          icon: "success",
          title: "Status Updated!",
          text: `Blog is now ${newStatus}`,
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error!", "Failed to update status.", "error");
      }
    } catch (error) {
      console.error("Error updating blog status:", error);
      Swal.fire("Error!", "Unexpected error occurred.", "error");
    }
  };

  const getBlogLink = (blog) => {
    if (blog.slug) {
      return `/blog/${blog.slug}`;
    }

    return `/blog/${blog._id}`;
  };

  return (
    <div className="w-full">
      <div className="hdr">Blogs</div>

      <div className="flex justify-end items-center mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="smbut"
        >
          + Add New Blog
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr className="text-center font-semibold">
              <th className="px-3 py-2">Cover</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Short Description</th>
              <th className="px-3 py-2">Author</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Views</th>
              <th className="px-3 py-2">Files</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <ShimmerTable rows={5} cols={8} asRows />
            ) : blogs.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center py-8 text-gray-400"
                >
                  No blogs uploaded yet.
                </td>
              </tr>
            ) : (
              blogs.map((blog) => (
                <tr key={blog._id} className="text-center border-b">
                  <td className="px-3 py-2">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-20 h-16 object-cover rounded mx-auto"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </td>

                  <td className="px-3 py-2 font-medium max-w-[180px]">
                    {blog.title}
                    {blog.slug && (
                      <p className="text-xs text-gray-400 mt-1">
                        {blog.slug}
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-2 max-w-xs truncate">
                    {blog.shortDescription}
                  </td>

                  <td className="px-3 py-2">
                    {blog.author || "Cloud Company"}
                  </td>

                  <td className="px-3 py-2">
                    <select
                      value={blog.status || "draft"}
                      onChange={(e) =>
                        handleStatusChange(blog._id, e.target.value)
                      }
                      className={`select select-bordered select-xs ${
                        blog.status === "published"
                          ? "bg-green-100 text-green-700"
                          : blog.status === "hidden"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="hidden">Hidden</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>

                  <td className="px-3 py-2">
                    {blog.views || 0}
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1 items-center">
                      {blog.jsxFile ? (
                        <a
                          href={blog.jsxFile}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          JSX File
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No JSX
                        </span>
                      )}

                      <span className="text-xs text-gray-500">
                        Images: {blog.blogImages?.length || 0}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-2 items-center">
                      <a
                        href={getBlogLink(blog)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-xs bg-blue-300 text-black"
                      >
                        View
                      </a>

                      <button
                        className="btn btn-xs bg-gray-300 text-black"
                        disabled
                      >
                        Update
                      </button>

                      <button
                        onClick={() => handleDelete(blog._id)}
                        className="btn btn-xs btn-error text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowForm(false);
                setCoverPreview(null);
                setSelectedImages([]);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-4 text-center">
              Add New Blog
            </h3>

            <form onSubmit={handleAddBlog} className="flex flex-col gap-3">
              <input
                name="title"
                type="text"
                placeholder="Blog Title"
                className="input input-bordered w-full"
                required
              />

              <textarea
                name="shortDescription"
                placeholder="Short Description"
                className="textarea textarea-bordered w-full min-h-24"
                required
              />

              <input
                name="author"
                type="text"
                placeholder="Author Name"
                className="input input-bordered w-full"
                defaultValue="Cloud Company"
              />

              <input
                name="tags"
                type="text"
                placeholder="Tags separated by comma, e.g. React, Business, Web"
                className="input input-bordered w-full"
              />

              <select
                name="status"
                className="select select-bordered w-full"
                defaultValue="draft"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
                <option value="archived">Archived</option>
              </select>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cover Image
                </label>

                <input
                  name="coverImage"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleCoverChange}
                  className="file-input file-input-bordered w-full"
                  required
                />

                {coverPreview && (
                  <img
                    src={coverPreview}
                    alt="Cover Preview"
                    className="w-full h-48 object-cover rounded-lg mt-3"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  JSX Blog File
                </label>

                <input
                  name="jsxFile"
                  type="file"
                  accept=".jsx"
                  className="file-input file-input-bordered w-full"
                  required
                />

                <p className="text-xs text-gray-500 mt-1">
                  Upload a JSX file that defines a component named{" "}
                  <strong>BlogPost</strong>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Blog Inner Images
                </label>

                <input
                  name="blogImages"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleBlogImagesChange}
                  className="file-input file-input-bordered w-full"
                />

                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {selectedImages.map((file, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-2 text-xs text-gray-500 truncate"
                      >
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary w-full mt-3">
                Upload Blog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;