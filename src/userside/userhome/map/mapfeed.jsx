import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { base_url } from "../../../config/config";
import { MapPinCheck } from 'lucide-react';
import { X } from 'lucide-react';

const worldMap = '/assets/world.svg';
const MAP_W = 2000;
const MAP_H = 857;

const Mapfeed = () => {
  const [icons, setIcons]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [newIcon, setNewIcon] = useState({
    id: '', position: { top: '', left: '' }, imageUrl: '', data: ''
  });

  useEffect(() => {
    setLoading(true);
    fetch(`${base_url}/map`)
      .then(r => r.json())
      .then(setIcons)
      .catch(() => Swal.fire('Error!', 'Failed to load icons.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (_id) => {
    Swal.fire({ title: "Are you sure?", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#3b82f6", cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!" })
    .then(async (result) => {
      if (!result.isConfirmed) return;
      const res  = await fetch(`${base_url}/delmap/${_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.deletedCount > 0) {
        Swal.fire('Deleted!', '', 'success');
        setIcons(prev => prev.filter(i => i._id !== _id));
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("position.")) {
      const key = name.split(".")[1];
      setNewIcon(p => ({ ...p, position: { ...p.position, [key]: value } }));
    } else {
      setNewIcon(p => ({ ...p, [name]: value }));
    }
  };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const renderedW = rect.width;
    const renderedH = rect.height;
    // Convert click px → original SVG coordinate space
    const origLeft = ((e.clientX - rect.left) / renderedW) * MAP_W;
    const origTop  = ((e.clientY - rect.top)  / renderedH) * MAP_H;
    setNewIcon(p => ({
      ...p,
      position: { top: `${Math.round(origTop)}px`, left: `${Math.round(origLeft)}px` }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${base_url}/addmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIcon),
      });
      if (!res.ok) throw new Error();
      setIcons(p => [...p, newIcon]);
      setNewIcon({ id: '', position: { top: '', left: '' }, imageUrl: '', data: '' });
      Swal.fire('Success!', 'Icon added.', 'success');
    } catch {
      Swal.fire('Error!', 'Failed to add icon.', 'error');
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 transition-colors";

  return (
    <div className="w-full p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-medium text-gray-900">Map Management</h1>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["ID","Position","Image","Tooltip","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm font-light">Loading...</td></tr>
              ) : icons.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm font-light">No pins added yet.</td></tr>
              ) : icons.map(icon => (
                <tr key={icon._id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{icon.id}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                    T:{icon.position.top} L:{icon.position.left}
                  </td>
                  <td className="px-4 py-3">
                    <img src={icon.imageUrl} alt={icon.id} className="w-10 h-10 rounded-xl object-cover" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate">{icon.data}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/update-icon/${icon._id}`}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                        Update
                      </Link>
                      <button onClick={() => handleDelete(icon._id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-7 mb-8">
        <h3 className="text-base font-medium text-gray-900 mb-5">Add New Pin</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {[
              { name: "id",          placeholder: "Pin ID",          readOnly: false },
              { name: "position.top", placeholder: "Top (auto)",     readOnly: true  },
              { name: "position.left",placeholder: "Left (auto)",    readOnly: true  },
              { name: "imageUrl",    placeholder: "Image URL",       readOnly: false },
              { name: "data",        placeholder: "Tooltip text",    readOnly: false },
            ].map(f => (
              <input key={f.name} name={f.name} readOnly={f.readOnly}
                value={f.name.startsWith("position.")
                  ? newIcon.position[f.name.split(".")[1]]
                  : newIcon[f.name]}
                onChange={handleInputChange}
                placeholder={f.placeholder} required
                className={inputClass + (f.readOnly ? " bg-gray-50 cursor-not-allowed" : "")}
              />
            ))}
          </div>
          <button type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm px-8 py-2.5 rounded-xl transition-all">
            Add Pin
          </button>
          <p className="text-xs text-gray-400 font-light mt-3">
            💡 Click anywhere on the map below to set the pin position automatically.
          </p>
        </form>
      </div>

      {/* Map preview */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">Map Preview — click to place pin</p>
        </div>
        <div className="overflow-x-auto">
          <div className="relative" style={{ minWidth: '600px' }}>
            <img
              src={worldMap} alt="World Map"
              className="w-full h-auto block cursor-crosshair select-none"
              onClick={handleMapClick}
              draggable={false}
            />
            {icons.map(icon => {
              const topPct  = (parseFloat(icon.position.top)  / MAP_H) * 100;
              const leftPct = (parseFloat(icon.position.left) / MAP_W) * 100;
              return (
                <div key={icon._id} className="absolute pointer-events-none"
                  style={{ top: `${topPct}%`, left: `${leftPct}%`, transform: 'translate(-50%,-100%)' }}>
                  <MapPinCheck className="w-5 h-5 text-blue-500" />
                </div>
              );
            })}
            {/* Preview new pin position */}
            {newIcon.position.top && (
              <div className="absolute pointer-events-none"
                style={{
                  top:  `${(parseFloat(newIcon.position.top)  / MAP_H) * 100}%`,
                  left: `${(parseFloat(newIcon.position.left) / MAP_W) * 100}%`,
                  transform: 'translate(-50%,-100%)'
                }}>
                <MapPinCheck className="w-5 h-5 text-emerald-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mapfeed;