import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { base_url } from '../../config/config';
import RichTextEditor from '../../userside/utils/PichTextEditor';

const EditPackage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        category: '',
        packageName: '',
        packagePrice: '',
        deliveryTime: '',
        expressDeliveryTime: '',
        expressDeliveryPrice: '',
        packageContents: Array(8).fill(''),
    });
    const [packageDetails, setPackageDetails] = useState('');
    const [packageRequirements, setPackageRequirements] = useState('');

    // Image state
    const [existingCover, setExistingCover] = useState(null); // URL from DB
    const [newCoverFile, setNewCoverFile] = useState(null);   // new File object
    const [coverPreview, setCoverPreview] = useState(null);   // blob preview URL

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, pkgRes] = await Promise.all([
                    fetch(`${base_url}/category`),
                    fetch(`${base_url}/package/${id}`),
                ]);
                if (!catRes.ok || !pkgRes.ok) throw new Error('Failed to fetch data');

                const catData = await catRes.json();
                const pkg = await pkgRes.json();

                setCategories(catData.map(item => item.category));

                // Fill form with existing package data
                const contents = Array(8).fill('');
                if (Array.isArray(pkg.packageContents)) {
                    pkg.packageContents.forEach((val, i) => { contents[i] = val || ''; });
                }

                setFormData({
                    category: pkg.category || '',
                    packageName: pkg.packageName || '',
                    packagePrice: pkg.packagePrice || '',
                    deliveryTime: pkg.deliveryTime || '',
                    expressDeliveryTime: pkg.expressDeliveryTime || '',
                    expressDeliveryPrice: pkg.expressDeliveryPrice || '',
                    packageContents: contents,
                });
                setPackageDetails(pkg.packageDetails || '');
                setPackageRequirements(pkg.packageRequirements || '');
                setExistingCover(pkg.packageCover || null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleContentChange = (index, value) => {
        setFormData(prev => {
            const updated = [...prev.packageContents];
            updated[index] = value;
            return { ...prev, packageContents: updated };
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setNewCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleRemoveNewFile = () => {
        setNewCoverFile(null);
        setCoverPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();
        data.append('category', formData.category);
        data.append('packageName', formData.packageName);
        data.append('packagePrice', formData.packagePrice);
        data.append('deliveryTime', formData.deliveryTime);
        data.append('expressDeliveryTime', formData.expressDeliveryTime);
        data.append('expressDeliveryPrice', formData.expressDeliveryPrice);
        data.append('packageDetails', packageDetails);
        data.append('packageRequirements', packageRequirements);
        data.append('packageContents', JSON.stringify(formData.packageContents.filter(Boolean)));

        // Only append file if user picked a new one
        if (newCoverFile) {
            data.append('packageCover', newCoverFile);
        }

        try {
            const response = await fetch(`${base_url}/updatepackage/${id}`, {
                method: 'PUT',
                body: data,
            });
            const result = await response.json();
            if (result.modifiedCount > 0 || result.success) {
                Swal.fire({ title: 'Package Updated!', icon: 'success', timer: 1500, showConfirmButton: false })
                    .then(() => navigate(-1));
            } else {
                Swal.fire({ title: 'No changes detected.', icon: 'info' });
            }
        } catch (err) {
            Swal.fire({ title: 'Error!', text: 'An unexpected error occurred.', icon: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-400">
                <span className="w-5 h-5 border-2 border-gray-300 border-t-violet-500 rounded-full animate-spin" />
                Loading package...
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

    // What image to show: new preview > existing URL > nothing
    const displayImage = coverPreview || existingCover;

    return (
        <div className="min-h-screen bg-gray-50 p-6">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Package</h1>
                    <p className="text-gray-400 text-sm mt-1">Update the details of this package</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 transition"
                >
                    ← Back
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col xl:flex-row gap-6 items-start">

                    {/* Left Column */}
                    <div className="flex flex-col gap-6 w-full xl:w-96">

                        {/* Basic Info */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <p className={sectionTitle}>Basic Info</p>
                            <div className="flex flex-col gap-4">

                                <div>
                                    <label className={labelCls}>Package Category</label>
                                    <select
                                        className={inputCls}
                                        value={formData.category}
                                        onChange={e => handleChange('category', e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select a category</option>
                                        {categories.map((cat, i) => (
                                            <option key={i} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cover Image */}
                                <div>
                                    <label className={labelCls}>Package Cover Image</label>

                                    {displayImage ? (
                                        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200">
                                            <img src={displayImage} alt="Cover" className="w-full h-full object-cover" />

                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-2">
                                                {/* Replace */}
                                                <label htmlFor="packageCover" className="bg-white text-violet-600 text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-violet-50 transition cursor-pointer">
                                                    Replace
                                                </label>
                                                {/* Remove new file (revert to existing) */}
                                                {newCoverFile && (
                                                    <button type="button" onClick={handleRemoveNewFile} className="bg-white text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-red-50 transition">
                                                        Revert
                                                    </button>
                                                )}
                                            </div>

                                            {/* Label at bottom */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-1.5 flex items-center gap-1.5">
                                                {newCoverFile ? (
                                                    <>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                        <p className="text-white text-xs truncate">{newCoverFile.name}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                        <p className="text-white text-xs">Current image</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
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
                                        </label>
                                    )}

                                    <input
                                        id="packageCover"
                                        name="packageCover"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>Package Name</label>
                                    <input
                                        className={inputCls} type="text"
                                        placeholder="e.g. Premium Design Package"
                                        value={formData.packageName}
                                        onChange={e => handleChange('packageName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Package Price ($)</label>
                                    <input
                                        className={inputCls} type="text"
                                        placeholder="e.g. 99"
                                        value={formData.packagePrice}
                                        onChange={e => handleChange('packagePrice', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <p className={sectionTitle}>Delivery</p>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className={labelCls}>Delivery Time</label>
                                    <input className={inputCls} type="text" placeholder="e.g. 5 days"
                                        value={formData.deliveryTime}
                                        onChange={e => handleChange('deliveryTime', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Express Delivery Time</label>
                                    <input className={inputCls} type="text" placeholder="e.g. 2 days"
                                        value={formData.expressDeliveryTime}
                                        onChange={e => handleChange('expressDeliveryTime', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Express Delivery Price ($)</label>
                                    <input className={inputCls} type="text" placeholder="e.g. 20"
                                        value={formData.expressDeliveryPrice}
                                        onChange={e => handleChange('expressDeliveryPrice', e.target.value)} />
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
                                {formData.packageContents.map((val, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-violet-50 text-violet-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                            {i + 1}
                                        </span>
                                        <input
                                            className={inputCls} type="text"
                                            placeholder={`Item ${i + 1}`}
                                            value={val}
                                            onChange={e => handleContentChange(i, e.target.value)}
                                        />
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
                                    Saving Changes...
                                </>
                            ) : '✓ Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditPackage;