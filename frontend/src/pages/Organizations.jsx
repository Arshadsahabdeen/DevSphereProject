import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { organizationsAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

const Organizations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await organizationsAPI.getMyOrganizations();
        if (res.data && res.data.length > 0) {
          setOrganization(res.data[0]); // assuming user belongs to one org
        }
      } catch (err) {
        console.error('fetchOrg error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const sendInvite = async () => {
    const teamId = prompt("Enter the Team ID to invite:");
    if (!teamId) return;
    try {
      const res = await organizationsAPI.sendTeamInvite({
        orgId: organization._id,
        teamId,
      });
      toast.success("Invite sent to team owner!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invite");
    }
  };


  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this organization? This cannot be undone.")) return;
    try {
      await organizationsAPI.delete(organization._id);
      toast.success("Organization deleted successfully");
      navigate('/dashboard');
    } catch (err) {
      console.error('delete org error:', err);
      toast.error(err.response?.data?.message || "Failed to delete organization");
    }
  };

  if (loading) return <div className="text-gray-400">Loading organization...</div>;

  if (!organization) return <div className="text-gray-400">No organization found.</div>;

  const isHead = String(organization.head?._id || organization.head) === String(user?._id || user?.id);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{organization.name}</h1>
      <p className="text-gray-600 mb-4">{organization.description}</p>
      <p className="text-sm text-gray-500 mb-4">
        Head: {organization.head?.name || 'Unknown'} ({organization.head?.email})
      </p>

      {/* ✅ Delete button visible only to head */}
      {isHead && (
        <div className="mt-6 border-t pt-4">
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Delete Organization
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Warning: This action cannot be undone.
          </p>
        </div>
      )}
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold mb-2">Add a Team to Organization</h3>
        <button
          onClick={() => sendInvite()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Send Team Invite
        </button>
      </div>

    </div>
  );
};

export default Organizations;
