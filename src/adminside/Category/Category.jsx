import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { useLoaderData } from "react-router-dom";
import Swal from 'sweetalert2';
import { base_url } from "../../config/config";

const Cetagory = () => {
    const loadercategorys = useLoaderData();
    const [categorys, setCategorys] = useState(loadercategorys);
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch(`${base_url}/category`)
            .then(res => res.json())
            .then(data => setCategorys(data))
            .catch(error => console.error('Error fetching categories:', error));
    }, []);

    const handleDelete = (_id) => {
        Swal.fire({
            title: "Delete category?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete",
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`${base_url}/delcategory/${_id}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.deletedCount > 0) {
                            setCategorys(categorys.filter(c => c._id !== _id));
                            Swal.fire({ title: "Deleted!", icon: "success", timer: 1500, showConfirmButton: false });
                        }
                    });
            }
        });
    };

    const handleAddCategory = async (event) => {
        event.preventDefault();
        const category = inputValue.trim();
        if (!category) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${base_url}/addcategory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category }),
            });
            const data = await response.json();
            if (data.insertedId) {
                setCategorys([...categorys, { category }]);
                setInputValue('');
                Swal.fire({ title: "Category added!", icon: "success", timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire({ title: "Error!", text: "Could not add category.", icon: "error" });
            }
        } catch (error) {
            Swal.fire({ title: "Error!", text: "An unexpected error occurred.", icon: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filtered = categorys.filter(c =>
        c.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
                <p className="text-gray-400 text-sm mt-1">Manage your product categories</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Add Category Card */}
                <div className="w-full lg:w-72 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-6">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
                        New Category
                    </h2>
                    <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
                                Category Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Electronics"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Adding...
                                </>
                            ) : '+ Add Category'}
                        </button>
                    </form>
                </div>

                {/* Table Card */}
                <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                    {/* Table Top Bar */}
                    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">All Categories</span>
                            <span className="bg-violet-50 text-violet-500 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {filtered.length}
                            </span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 placeholder-gray-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition w-48"
                        />
                    </div>

                    {/* Table */}
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 w-12">#</th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Category</th>
                                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-12 text-gray-300 text-sm">
                                        No categories found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((category, index) => (
                                    <tr key={category._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-sm text-gray-300">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                                                <span className="text-sm font-medium text-gray-700">{category.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/update/${category._id}`}
                                                    className="text-xs font-medium text-blue-500 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg transition"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(category._id)}
                                                    className="text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg transition"
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
            </div>
        </div>
    );
};

export default Cetagory;