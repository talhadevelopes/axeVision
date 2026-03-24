import type React from "react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useMemberStore } from "../../stores/memberStore";
import { useMembers } from "../../hooks/useMembers";
import {
  User,
  UserPlus,
  Shield,
  Edit3,
  Trash2,
  Users,
  Calendar,
} from "lucide-react";
import { ErrorDisplay, LoadingDisplay } from "../../components";

const TeamManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const [error, setError] = useState<string>("");

  // Zustand store
  const {
    selectedMember,
    isEditing,
    isCreating,
    teamLead,
    formData,
    setTeamLead,
    setFormData,
    selectMember,
    startEditing,
    startCreating,
    cancelForm,
  } = useMemberStore();

  // TanStack Query
  const {
    members,
    isLoading,
    error: queryError,
    createMember,
    updateMember,
    deleteMember,
    isCreating: isCreatingMutation,
    isUpdating,
    isDeleting,
  } = useMembers();

  // Set team lead when members change
  useEffect(() => {
    if (members.length > 0) {
      const foundTeamLead = members.find((member) => member.type === "Admin");
      setTeamLead(foundTeamLead || null);
    }
  }, [members, setTeamLead]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) {
      setError("Name and role are required");
      return;
    }

    if (user?.memberType === "Admin" && !formData.type) {
      setError("Member type is required for Admin actions.");
      return;
    }

    setError("");

    if (isCreating) {
      createMember(formData);
      cancelForm();
    } else if (isEditing && selectedMember) {
      updateMember({ memberId: selectedMember.memberId, formData });
      cancelForm();
    }
  };

  // Handle delete with confirmation
  const handleDelete = (memberId: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    deleteMember(memberId);
    if (selectedMember?.memberId === memberId) {
      selectMember(null);
    }
  };

  if (isLoading) {
    return <LoadingDisplay message="Loading team data..." />;
  }

  if (error) {
    return <ErrorDisplay title="Unable to Load DOM" message={error} />;
  }

  if (!user?.onboarded) {
    return (
      <ErrorDisplay
        title="Access Denied"
        message="Please complete your onboarding to access Manage Team."
        icon={<Shield className="w-10 h-10 text-white" />}
      />
    );
  }

  const isAdmin = user?.memberType === "Admin";
  const displayError = error || queryError;

  return (
    <div
      className="min-h-screen py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50"
      style={{ fontFamily: "Space Grotesk, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Team Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your team members and permissions
          </p>
        </div>

        {!isAdmin && teamLead && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-500 rounded-xl mr-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Team Lead
                  </h2>
                  <p className="text-green-600 text-sm font-medium">
                    Administrative Contact
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <User className="w-4 h-4 mr-3 text-green-500" />
                  <span className="font-medium">{teamLead.name}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Edit3 className="w-4 h-4 mr-3 text-green-500" />
                  <span>{teamLead.role}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {displayError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <p className="text-red-600 font-medium">{displayError}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-green-500 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Team Members ({members.length})
                </h2>
              </div>
              {isAdmin && (
                <button
                  onClick={startCreating}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-green-500/25"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </button>
              )}
            </div>

            {members.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isAdmin
                    ? "Create your first member profile!"
                    : "Contact your admin to be added."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.memberId}
                    onClick={() => selectMember(member)}
                    className={`bg-white/80 backdrop-blur-xl border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg shadow-sm ${
                      selectedMember?.memberId === member.memberId
                        ? "border-green-300 shadow-green-500/10 shadow-xl bg-green-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div
                            className={`p-2 rounded-lg mr-3 ${
                              member.type === "Admin"
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                          >
                            {member.type === "Admin" ? (
                              <Shield className="w-4 h-4 text-white" />
                            ) : (
                              <User className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {member.name}
                            </h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                member.type === "Admin"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {member.type}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2">{member.role}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {isAdmin && member.memberId !== user?.memberId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(member.memberId);
                          }}
                          disabled={isDeleting}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {selectedMember && !isEditing && !isCreating && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Member Details
                  </h2>
                  {(isAdmin || selectedMember.memberId === user?.memberId) && (
                    <button
                      onClick={startEditing}
                      className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-gray-900 font-medium">
                        {selectedMember.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Edit3 className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="text-gray-900 font-medium">
                        {selectedMember.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedMember.type === "Admin"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {selectedMember.type}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Member ID</p>
                      <p className="text-gray-600 font-mono text-sm">
                        {selectedMember.memberId}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="text-gray-600 text-sm">
                          {new Date(
                            selectedMember.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Updated</p>
                        <p className="text-gray-600 text-sm">
                          {new Date(
                            selectedMember.updatedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(isCreating || isEditing) && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {isCreating ? "Create New Member" : "Edit Member"}
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                      placeholder="e.g., QA Engineer, Developer, Manager"
                      required
                    />
                  </div>

                  {(isAdmin || isCreating) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as "Admin" | "Member",
                          })
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                        required
                        disabled={!isAdmin && !isCreating}
                      >
                        <option value="Member">Member</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={isCreatingMutation || isUpdating}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-green-500/25"
                    >
                      {isCreatingMutation || isUpdating
                        ? isCreating
                          ? "Creating..."
                          : "Updating..."
                        : isCreating
                          ? "Create Member"
                          : "Update Member"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!selectedMember && !isCreating && !isEditing && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Select a member from the list to view details
                </p>
                {isAdmin && (
                  <>
                    <p className="text-gray-500 mb-4">or</p>
                    <button
                      onClick={startCreating}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-green-500/25"
                    >
                      Create New Member
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;
