import { useEffect, useState } from 'react';
import { base_url } from '../../config/config';
const OurClient = () => {
  const [activeTab, setActiveTab] = useState('read'); // Manage active tab
  const [clients, setClients] = useState([]); // Client data
  const [formData, setFormData] = useState({ name: '', logo: '' }); // Form data
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state

  // Fetch clients from backend
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${base_url}/certificate`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setClients(data); // Update client data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add or Update client in backend
  const handleSave = async () => {
    if (formData.name && formData.logo) {
      setLoading(true);
      try {
        const url = formData._id
          ? `${base_url}/addcertificate`
          : `${base_url}/addcertificate`;
        const method = formData._id ? 'PUT' : 'POST';
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to save client');
        }
        fetchClients(); // Refresh clients after save
        setFormData({ name: '', logo: '' }); // Reset form
        setActiveTab('read'); // Switch to read tab
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete client from backend
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this client?');
    if (confirmDelete) {
      setLoading(true);
      try {
        const response = await fetch(`${base_url}/delcertificate/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete client');
        }
        fetchClients(); // Refresh clients after deletion
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Populate form data for editing
  const handleEdit = (client) => {
    setFormData(client); // Set form with client data
    setActiveTab('create'); // Switch to Create tab
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'read') {
      fetchClients();
    }
  };

  useEffect(() => {
    fetchClients(); // Initial fetch
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Manage Clients</h2>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        {['read', 'create'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 mx-2 rounded ${
              activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {tab === 'read' ? 'View Clients' : 'Add/Edit Client'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'read' && (
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500">Error: {error}</p>
          ) : clients.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="border px-4 py-2">#</th>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Logo</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr key={client._id} className="text-center">
                    <td className="border px-4 py-2">{index + 1}</td>
                    <td className="border px-4 py-2">{client.name}</td>
                    <td className="border px-4 py-2">
                      <img
                        src={client.logo}
                        alt={client.name}
                        className="h-10 w-10 mx-auto"
                      />
                    </td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client._id)}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500">No clients found.</p>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-gray-100 p-6 rounded">
          <h3 className="text-xl font-semibold mb-4">
            {formData._id ? 'Edit Client' : 'Add New Client'}
          </h3>
          <div className="mb-4">
            <label className="block mb-2">Client Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter client name"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Logo URL</label>
            <input
              type="text"
              name="logo"
              value={formData.logo}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter logo URL"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => setActiveTab('read')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OurClient;
