import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  Gamepad2,
  Lock,
  Mail,
  MapPin,
  Save,
  Sparkles,
  Trash2,
  User,
  VenusAndMars,
} from "lucide-react";

import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

const Profile = () => {
  const { notify } = useNotifications();

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    role: "",
    age: "",
    gender: "",
    city: "",
    profile_image: "",
    created_at: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);

  const loadProfile = async (showErrorNotification = true) => {
    try {
      const response = await api.get("/auth/profile");
      const user = response.data.user;

      setProfile({
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role || "",
        age: user.age || "",
        gender: user.gender || "",
        city: user.city || "",
        profile_image: user.profile_image || "",
        created_at: user.created_at || "",
      });
    } catch (error) {
      console.error("Profile load error:", error);

      if (showErrorNotification) {
        notify({
          type: "danger",
          title: "Profile Load Failed",
          duration: 4000,
        });
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const initials = useMemo(() => {
    if (!profile.full_name) {
      return "GB";
    }

    return profile.full_name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile.full_name]);

  const profileCompletion = useMemo(() => {
    const fields = [
      profile.full_name,
      profile.email,
      profile.age,
      profile.gender,
      profile.city,
      profile.profile_image,
    ];

    const completedFields = fields.filter(Boolean).length;

    return Math.round(
      (completedFields / fields.length) * 100
    );
  }, [profile]);

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : "Not available";

  const profileImageUrl = profile.profile_image
    ? `${API_BASE_URL}${profile.profile_image}`
    : "";

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const updateSavedUser = (updatedFields) => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem("gamebalance_user")
      );

      if (!savedUser) {
        return;
      }

      localStorage.setItem(
        "gamebalance_user",
        JSON.stringify({
          ...savedUser,
          ...updatedFields,
        })
      );
    } catch (error) {
      console.error(
        "Failed to update local user data:",
        error
      );
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      notify({
        type: "danger",
        title: "Invalid Image Format",
        duration: 4000,
      });

      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify({
        type: "warning",
        title: "Image Must Be Under 2MB",
        duration: 4000,
      });

      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();

      formData.append("profile_image", file);

      const response = await api.put(
        "/auth/profile/image",
        formData
      );

      const newProfileImage = response.data.profile_image;

      setProfile((currentProfile) => ({
        ...currentProfile,
        profile_image: newProfileImage,
      }));

      updateSavedUser({
        profile_image: newProfileImage,
      });

      notify({
        type: "success",
        title: "Profile Picture Updated",
        duration: 4000,
      });
    } catch (error) {
      console.error("Profile image upload error:", error);

      notify({
        type: "danger",
        title: "Image Upload Failed",
        duration: 4000,
      });
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const removeProfileImage = async () => {
    if (!profile.profile_image || removingImage) {
      return;
    }

    try {
      setRemovingImage(true);

      await api.delete("/auth/profile/image");

      setProfile((currentProfile) => ({
        ...currentProfile,
        profile_image: "",
      }));

      updateSavedUser({
        profile_image: "",
      });

      notify({
        type: "success",
        title: "Profile Picture Removed",
        duration: 4000,
      });
    } catch (error) {
      console.error("Profile image removal error:", error);

      notify({
        type: "danger",
        title: "Image Removal Failed",
        duration: 4000,
      });
    } finally {
      setRemovingImage(false);
    }
  };

  const updateProfile = async (event) => {
    event.preventDefault();

    if (savingProfile) {
      return;
    }

    try {
      setSavingProfile(true);

      const response = await api.put("/auth/profile", {
        full_name: profile.full_name,
        age: profile.age,
        gender: profile.gender,
        city: profile.city,
      });

      const updatedUser = response.data.user;

      updateSavedUser({
        full_name: updatedUser.full_name,
        age: updatedUser.age,
        gender: updatedUser.gender,
        city: updatedUser.city,
        profile_image: updatedUser.profile_image,
      });

      await loadProfile(false);

      notify({
        type: "success",
        title: "Profile Updated",
        duration: 4000,
      });
    } catch (error) {
      console.error("Profile update error:", error);

      notify({
        type: "danger",
        title: "Profile Update Failed",
        duration: 4000,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (changingPassword) {
      return;
    }

    if (
      !passwordData.current_password ||
      !passwordData.new_password
    ) {
      notify({
        type: "warning",
        title: "Enter Both Passwords",
        duration: 4000,
      });

      return;
    }

    try {
      setChangingPassword(true);

      await api.put(
        "/auth/change-password",
        passwordData
      );

      setPasswordData({
        current_password: "",
        new_password: "",
      });

      notify({
        type: "success",
        title: "Password Changed",
        duration: 4000,
      });
    } catch (error) {
      console.error("Password change error:", error);

      const status = error.response?.status;

      if (status === 400 || status === 401) {
        notify({
          type: "danger",
          title: "Current Password Incorrect",
          duration: 4000,
        });
      } else {
        notify({
          type: "danger",
          title: "Password Change Failed",
          duration: 4000,
        });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="module-page profile-page profile-command-page">
      <div className="module-header profile-top-header">
        <div>
          <h1>Profile Command Center</h1>

          <p>
            Customize identity, account details, and
            security settings.
          </p>
        </div>
      </div>

      <section className="profile-command-hero">
        <div className="profile-main-card">
          <div className="profile-scan-lines"></div>

          <div className="profile-avatar-zone">
            <div className="profile-ring">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={`${profile.full_name || "User"} profile`}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar initials-avatar">
                  {initials}
                </div>
              )}
            </div>

            <label
              className={`profile-upload-action ${
                uploadingImage ? "is-disabled" : ""
              }`}
            >
              <Camera size={15} />

              {uploadingImage
                ? "Uploading..."
                : "Upload Photo"}

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={uploadingImage}
              />
            </label>
          </div>

          <h2>
            {profile.full_name || "GameBalance User"}
          </h2>

          <p className="profile-email-text">
            {profile.email}
          </p>

          <div className="profile-mini-badges">
            <span className="profile-chip">
              <Gamepad2 size={13} />

              {profile.role || "USER"}
            </span>

            <span className="profile-chip">
              <User size={13} />

              Age {profile.age || "N/A"}
            </span>

            <span className="profile-chip">
              <MapPin size={13} />

              {profile.city || "City not set"}
            </span>
          </div>

          <div className="profile-progress compact-progress">
            <div className="profile-progress-top">
              <span>Profile Completion</span>

              <strong>{profileCompletion}%</strong>
            </div>

            <div className="profile-progress-track">
              <div
                className="profile-progress-fill"
                style={{
                  width: `${profileCompletion}%`,
                }}
              ></div>
            </div>
          </div>

          {profile.profile_image && (
            <button
              type="button"
              className="profile-remove-btn"
              onClick={removeProfileImage}
              disabled={removingImage}
            >
              <Trash2 size={15} />

              {removingImage
                ? "Removing..."
                : "Remove Photo"}
            </button>
          )}
        </div>

        <div className="profile-identity-panel">
          <div className="profile-identity-card featured">
            <Sparkles />

            <div>
              <p>Display Name</p>

              <h3>
                {profile.full_name || "Not set"}
              </h3>
            </div>
          </div>

          <div className="profile-identity-card">
            <Mail />

            <div>
              <p>Email</p>

              <h3>{profile.email || "Not set"}</h3>
            </div>
          </div>

          <div className="profile-identity-card">
            <VenusAndMars />

            <div>
              <p>Gender</p>

              <h3>{profile.gender || "Not set"}</h3>
            </div>
          </div>

          <div className="profile-identity-card">
            <CalendarDays />

            <div>
              <p>Member Since</p>

              <h3>{memberSince}</h3>
            </div>
          </div>

          <div className="profile-identity-card">
            <MapPin />

            <div>
              <p>Location</p>

              <h3>{profile.city || "Not set"}</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-edit-grid">
        <div className="panel profile-panel">
          <div className="panel-title">
            <User />

            <h3>Edit Profile Details</h3>
          </div>

          <form
            className="module-form"
            onSubmit={updateProfile}
          >
            <label>Full Name</label>

            <input
              type="text"
              name="full_name"
              value={profile.full_name}
              onChange={handleProfileChange}
              required
            />

            <label>Email Address</label>

            <input
              type="email"
              value={profile.email}
              disabled
            />

            <div className="form-row">
              <div>
                <label>Age</label>

                <input
                  type="number"
                  name="age"
                  min="18"
                  max="20"
                  value={profile.age}
                  onChange={handleProfileChange}
                />
              </div>

              <div>
                <label>Gender</label>

                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleProfileChange}
                >
                  <option value="">
                    Select Gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>
            </div>

            <label>City</label>

            <input
              type="text"
              name="city"
              value={profile.city}
              onChange={handleProfileChange}
            />

            <button
              type="submit"
              disabled={savingProfile}
            >
              <Save size={17} />

              {savingProfile
                ? "Saving..."
                : "Save Profile Changes"}
            </button>
          </form>
        </div>

        <div className="panel profile-panel">
          <div className="panel-title">
            <Lock />

            <h3>Security Settings</h3>
          </div>

          <form
            className="module-form"
            onSubmit={changePassword}
          >
            <label>Current Password</label>

            <input
              type="password"
              name="current_password"
              value={passwordData.current_password}
              onChange={handlePasswordChange}
              placeholder="Enter current password"
              autoComplete="current-password"
              required
            />

            <label>New Password</label>

            <input
              type="password"
              name="new_password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              autoComplete="new-password"
              required
            />

            <button
              type="submit"
              disabled={changingPassword}
            >
              <Lock size={17} />

              {changingPassword
                ? "Changing..."
                : "Change Password"}
            </button>
          </form>

          <div className="result-box security-note">
            <h3>Security Note</h3>

            <p>
              Your account security matters. To update your password,
              please enter your current password and choose a strong,
              unique new password. Never share your password with anyone.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;