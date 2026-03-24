import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { base_url } from '../../config/config';
import RichTextEditor from '../../userside/utils/PichTextEditor';

const AddPackages = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [packageDetails, setPackageDetails] = useState("");
    const [packageRequirements, setPackageRequirements] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${base_url}/category`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setCategories(data.map(item => item.category));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleRemoveFile = () => {
        setCoverFile(null);
        setCoverPreview(null);
    };

    const handleAddPost = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        const form = event.target;
        const getTrimmedValue = (name) => form[name]?.value?.trim() || '';

        // Use FormData — same as your /addclientdp route
        const formData = new FormData();
        formData.append('category', form.categories?.value);
        formData.append('packageName', getTrimmedValue('packageName'));
        formData.append('packagePrice', getTrimmedValue('packagePrice'));
        formData.append('deliveryTime', getTrimmedValue('deliveryTime'));
        formData.append('expressDeliveryTime', getTrimmedValue('expressDeliveryTime'));
        formData.append('expressDeliveryPrice', getTrimmedValue('expressDeliveryPrice'));
        formData.append('packageDetails', packageDetails);
        formData.append('packageRequirements', packageRequirements);

        const contents = Array.from({ length: 8 }, (_, i) =>
            getTrimmedValue(`content${i + 1}`)
        ).filter(Boolean);
        formData.append('packageContents', JSON.stringify(contents));

        if (coverFile) {
            formData.append('packageCover', coverFile); // multer reads this field
        }

        try {
            const response = await fetch(`${base_url}/addpackages`, {
                method: 'POST',
                body: formData, // No Content-Type header — browser sets multipart boundary
            });
            const data = await response.json();
            if (data.insertedId) {
                Swal.fire({ title: "Package Added!", icon: "success", timer: 1500, showConfirmButton: false });
                form.reset();
                setPackageDetails("");
                setPackageRequirements("");
                setCoverFile(null);
                setCoverPreview(null);
            } else {
                Swal.fire({ title: "Error!", text: "There was an issue adding the package.", icon: "error" });
            }
        } catch (error) {
            Swal.fire({ title: "Error!", text: "An unexpected error occurred.", icon: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-400">
                <span className="w-5 h-5 border-2 border-gray-300 border-t-violet-500 rounded-full animate-spin" />
                Loading categories...
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-red-50 text-red-500 border border-red-100 rounded-xl px-6 py-4 text-sm">
                Error: {error}
            </div>
        </div>
    );

    const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";
    const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";
    const sectionTitle = "text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4";

    return (
        <div className="min-h-screen bg-gray-50 p-6">

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Add Package</h1>
                <p className="text-gray-400 text-sm mt-1">Fill in the details to create a new package</p>
            </div>

            <form onSubmit={handleAddPost}>
                <div className="flex flex-col xl:flex-row gap-6 items-start">

                    {/* Left Column */}
                    <div className="flex flex-col gap-6 w-full xl:w-96">

                        {/* Basic Info */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <p className={sectionTitle}>Basic Info</p>
                            <div className="flex flex-col gap-4">

                                <div>
                                    <label className={labelCls}>Package Category</label>
                                    <select name="categories" className={inputCls} required>
                                        <option value="" disabled defaultValue="">Select a category</option>
                                        {categories.map((cat, i) => (
                                            <option key={i} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cover Image Uploader */}
                                <div>
                                    <label className={labelCls}>Package Cover Image</label>
                                    {!coverPreview ? (
                                        <label
                                            htmlFor="packageCover"
                                            className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50 hover:bg-violet-50 hover:border-violet-300 transition group"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-gray-300 group-hover:text-violet-400 transition">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a1 1 0 001 1h16a1 1 0 001-1v-2.5M16 10l-4-4m0 0L8 10m4-4v12" />
                                                </svg>
                                                <span className="text-xs font-medium">Click to upload image</span>
                                                <span className="text-xs text-gray-300">PNG, JPG, WEBP</span>
                                            </div>
                                            <input
                                                id="packageCover"
                                                name="packageCover"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                                required
                                            />
                                        </label>
                                    ) : (
                                        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200">
                                            <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    className="bg-white text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-red-50 transition"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-1.5">
                                                <p className="text-white text-xs truncate">{coverFile?.name}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className={labelCls}>Package Name</label>
                                    <input name="packageName" className={inputCls} type="text" placeholder="e.g. Premium Design Package" required />
                                </div>
                                <div>
                                    <label className={labelCls}>Package Price ($)</label>
                                    <input name="packagePrice" className={inputCls} type="text" placeholder="e.g. 99" required />
                                </div>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <p className={sectionTitle}>Delivery</p>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className={labelCls}>Delivery Time</label>
                                    <input name="deliveryTime" className={inputCls} type="text" placeholder="e.g. 5 days" />
                                </div>
                                <div>
                                    <label className={labelCls}>Express Delivery Time</label>
                                    <input name="expressDeliveryTime" className={inputCls} type="text" placeholder="e.g. 2 days" />
                                </div>
                                <div>
                                    <label className={labelCls}>Express Delivery Price ($)</label>
                                    <input name="expressDeliveryPrice" className={inputCls} type="text" placeholder="e.g. 20" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6 flex-1 w-full">

                        {/* Package Contents */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <p className={sectionTitle}>Package Contents</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-violet-50 text-violet-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                            {i + 1}
                                        </span>
                                        <input name={`content${i + 1}`} className={inputCls} type="text" placeholder={`Item ${i + 1}`} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <p className={sectionTitle}>Package Requirements</p>
                            <RichTextEditor value={packageRequirements} onChange={setPackageRequirements} className="bg-white rounded-lg w-full h-32" />
                        </div>

                        {/* Details */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <p className={sectionTitle}>Package Details</p>
                            <RichTextEditor value={packageDetails} onChange={setPackageDetails} className="bg-white rounded-lg w-full h-56" />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Adding Package...
                                </>
                            ) : '+ Add Package'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddPackages;