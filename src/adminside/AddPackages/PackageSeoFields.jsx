/* eslint-disable react/prop-types */

export const emptySeo = { slug: '', metaTitle: '', metaDescription: '', keywords: '', faqs: [] };

// Mirrors the server's slugify so the preview matches the saved URL.
export const slugify = (text) =>
    String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);

// Shape the server expects: keywords as a comma string, faqs as a JSON string.
export const appendSeo = (formData, seo) => {
    formData.append('slug', seo.slug);
    formData.append('metaTitle', seo.metaTitle);
    formData.append('metaDescription', seo.metaDescription);
    formData.append('keywords', seo.keywords);
    formData.append('faqs', JSON.stringify(seo.faqs.filter(f => f.q.trim() && f.a.trim())));
};

export const seoFromPackage = (pkg) => ({
    slug: pkg.slug || '',
    metaTitle: pkg.metaTitle || '',
    metaDescription: pkg.metaDescription || '',
    keywords: Array.isArray(pkg.keywords) ? pkg.keywords.join(', ') : (pkg.keywords || ''),
    faqs: Array.isArray(pkg.faqs) ? pkg.faqs.map(f => ({ q: f.q || '', a: f.a || '' })) : [],
});

const Counter = ({ value, max }) => (
    <span className={`text-[10px] font-medium ${value.length > max ? 'text-red-500' : 'text-gray-300'}`}>
        {value.length}/{max}
    </span>
);

const PackageSeoFields = ({ seo, onChange, packageName, inputCls, labelCls, sectionTitle }) => {
    const set = (field, value) => onChange({ ...seo, [field]: value });

    const setFaq = (index, field, value) =>
        set('faqs', seo.faqs.map((f, i) => (i === index ? { ...f, [field]: value } : f)));

    const slugPreview = slugify(seo.slug || packageName) || 'package-name';

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <p className={sectionTitle}>SEO</p>
            <div className="flex flex-col gap-4">

                <div>
                    <label className={labelCls}>URL Slug</label>
                    <input className={inputCls} type="text" placeholder="Leave empty to generate from the package name"
                        value={seo.slug} onChange={e => set('slug', e.target.value)} />
                    <p className="text-[11px] text-gray-400 mt-1 break-all">cloudcompany.cc/packdetails/<span className="text-violet-500">{slugPreview}</span></p>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label className={labelCls}>Meta Title</label>
                        <Counter value={seo.metaTitle} max={60} />
                    </div>
                    <input className={inputCls} type="text" placeholder="e.g. Logo Design in Bangladesh – ৳4,000"
                        value={seo.metaTitle} onChange={e => set('metaTitle', e.target.value)} />
                    <p className="text-[11px] text-gray-400 mt-1">&quot;| Cloud Company&quot; is added automatically. Empty uses the package name.</p>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label className={labelCls}>Meta Description</label>
                        <Counter value={seo.metaDescription} max={160} />
                    </div>
                    <textarea className={`${inputCls} resize-none`} rows={3} placeholder="What Google shows under the title (140–160 characters)"
                        value={seo.metaDescription} onChange={e => set('metaDescription', e.target.value)} />
                </div>

                <div>
                    <label className={labelCls}>Keywords (comma separated)</label>
                    <input className={inputCls} type="text" placeholder="logo design bangladesh, logo design price in bd"
                        value={seo.keywords} onChange={e => set('keywords', e.target.value)} />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className={`${labelCls} mb-0`}>FAQ</label>
                        <button type="button" onClick={() => set('faqs', [...seo.faqs, { q: '', a: '' }])}
                            className="text-xs font-medium text-ink-900 hover:text-ink-900">
                            + Add question
                        </button>
                    </div>
                    {seo.faqs.length === 0 && (
                        <p className="text-[11px] text-gray-400">Shown on the package page and used for Google FAQ results.</p>
                    )}
                    <div className="flex flex-col gap-3">
                        {seo.faqs.map((f, i) => (
                            <div key={i} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <input className={inputCls} type="text" placeholder={`Question ${i + 1}`}
                                        value={f.q} onChange={e => setFaq(i, 'q', e.target.value)} />
                                    <button type="button" onClick={() => set('faqs', seo.faqs.filter((_, j) => j !== i))}
                                        className="text-red-400 hover:text-red-600 text-lg leading-none px-1" aria-label="Remove question">
                                        ×
                                    </button>
                                </div>
                                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Answer"
                                    value={f.a} onChange={e => setFaq(i, 'a', e.target.value)} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageSeoFields;
