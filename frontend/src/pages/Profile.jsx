
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

const emptyPassword = {
  current_password: "",
  code: "",
  new_password: "",
  confirm_password: "",
};

const Profile = () => {
  const { notify } = useNotifications();
  const { logout } = useAuth();
  const navigate = useNavigate();

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

  const [passwordData, setPasswordData] =
    useState(emptyPassword);

  const [codeRequested, setCodeRequested] =
    useState(false);

  const [passwordFeedback, setPasswordFeedback] =
    useState("");

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [removingImage, setRemovingImage] =
    useState(false);

  // =====================================
  // LOAD PROFILE
  // =====================================

  const loadProfile = async (
    showErrorNotification = true
  ) => {
    try {
      const { data } = await api.get(
        "/auth/profile"
      );

      const user = data.user;

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

  // =====================================
  // PROFILE DETAILS
  // =====================================

  const initials = useMemo(
    () =>
      profile.full_name
        ? profile.full_name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "GB",
    [profile.full_name]
  );

  const profileCompletion = useMemo(() => {
    const fields = [
      profile.full_name,
      profile.email,
      profile.age,
      profile.gender,
      profile.city,
      profile.profile_image,
    ];

    return Math.round(
      (fields.filter(Boolean).length / fields.length) * 100
    );
  }, [profile]);

  const memberSince = profile.created_at
    ? new Date(
        profile.created_at
      ).toLocaleDateString()
    : "Not available";

  const profileImageUrl = profile.profile_image
    ? `${API_BASE_URL}${profile.profile_image}`
    : "";

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateSavedUser = (updatedFields) => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem("gamebalance_user")
      );

      if (savedUser) {
        localStorage.setItem(
          "gamebalance_user",
          JSON.stringify({
            ...savedUser,
            ...updatedFields,
          })
        );
      }
    } catch (error) {
      console.error(
        "Could not update local user:",
        error
      );
    }
  };

  // =====================================
  // UPLOAD PROFILE IMAGE
  // =====================================

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

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

      formData.append(
        "profile_image",
        file
      );

      const { data } = await api.put(
        "/auth/profile/image",
        formData
      );

      setProfile((current) => ({
        ...current,
        profile_image: data.profile_image,
      }));

      updateSavedUser({
        profile_image: data.profile_image,
      });

      notify({
        type: "success",
        title: "Profile Picture Updated",
        duration: 4000,
      });
    } catch (error) {
      console.error(
        "Profile image upload error:",
        error
      );

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

  // =====================================
  // REMOVE PROFILE IMAGE
  // =====================================

  const removeProfileImage = async () => {
    if (
      !profile.profile_image ||
      removingImage
    ) {
      return;
    }

    try {
      setRemovingImage(true);

      await api.delete(
        "/auth/profile/image"
      );

      setProfile((current) => ({
        ...current,
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
      console.error(
        "Profile image removal error:",
        error
      );

      notify({
        type: "danger",
        title: "Image Removal Failed",
        duration: 4000,
      });
    } finally {
      setRemovingImage(false);
    }
  };

  // =====================================
  // UPDATE PROFILE
  // =====================================

  const updateProfile = async (event) => {
    event.preventDefault();

    if (savingProfile) return;

    try {
      setSavingProfile(true);

      const { data } = await api.put(
        "/auth/profile",
        {
          full_name: profile.full_name,
          age: profile.age,
          gender: profile.gender,
          city: profile.city,
        }
      );

      const user = data.user;

      updateSavedUser({
        full_name: user.full_name,
        age: user.age,
        gender: user.gender,
        city: user.city,
        profile_image: user.profile_image,
      });

      await loadProfile(false);

      notify({
        type: "success",
        title: "Profile Updated",
        duration: 4000,
      });
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      notify({
        type: "danger",
        title: "Profile Update Failed",
        duration: 4000,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // =====================================
  // STEP 1: EMAIL VERIFICATION CODE
  // =====================================

  const requestPasswordCode = async () => {
    if (changingPassword) return;

    if (!passwordData.current_password) {
      setPasswordFeedback(
        "Enter your current password first."
      );
      return;
    }

    setChangingPassword(true);
    setPasswordFeedback("");

    try {
      const { data } = await api.post(
        "/auth/password/request-change",
        {
          current_password:
            passwordData.current_password,
        }
      );

      setCodeRequested(true);

      setPasswordFeedback(
        data.message ||
        "Check your email for a verification code."
      );
    } catch (error) {
      setPasswordFeedback(
        error.response?.data?.message ||
        "Could not send the code."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // =====================================
  // STEP 2: CHANGE PASSWORD
  // =====================================

  const changePassword = async (event) => {
    event.preventDefault();

    if (
      changingPassword ||
      !codeRequested
    ) {
      return;
    }

    if (
      passwordData.new_password !==
      passwordData.confirm_password
    ) {
      setPasswordFeedback(
        "New passwords do not match."
      );
      return;
    }

    setChangingPassword(true);
    setPasswordFeedback("");

    try {
      await api.post(
        "/auth/password/confirm-change",
        {
          code: passwordData.code,
          new_password:
            passwordData.new_password,
        }
      );

      setPasswordData(emptyPassword);
      setCodeRequested(false);

      // Backend invalidates previous tokens.
      logout();

      navigate("/login", {
        replace: true,
      });

      notify({
        type: "success",
        title: "Password Changed - Log In Again",
        duration: 5000,
      });
    } catch (error) {
      setPasswordFeedback(
        error.response?.data?.message ||
        "Password change failed."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // =====================================
  // PROFILE PAGE
  // =====================================

  return (
    <div className="module-page profile-page profile-command-page">

      {/* PAGE HEADER */}
      <div className="module-header profile-top-header">
        <div>
          <h1>Profile Command Center</h1>

          <p>
            Customize identity, account details,
            and security settings.
          </p>
        </div>
      </div>

      {/* PROFILE HERO */}
      <section className="profile-command-hero">

        <div className="profile-main-card">
          <div className="profile-scan-lines" />

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
              />
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

        {/* PROFILE INFORMATION */}
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
              <h3>
                {profile.email || "Not set"}
              </h3>
            </div>
          </div>

          <div className="profile-identity-card">
            <VenusAndMars />

            <div>
              <p>Gender</p>
              <h3>
                {profile.gender || "Not set"}
              </h3>
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
              <h3>
                {profile.city || "Not set"}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* EDIT PROFILE AND SECURITY */}
      <section className="profile-edit-grid">

        {/* PROFILE EDIT FORM */}
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

        {/* SECURITY SETTINGS */}
        <div className="panel profile-panel">
          <div className="panel-title">
            <Lock />
            <h3>Security Settings</h3>
          </div>

          <form
            className="module-form"
            onSubmit={changePassword}
          >
            <label htmlFor="profile-current-password">
              Current Password
            </label>

            <input
              id="profile-current-password"
              type="password"
              name="current_password"
              autoComplete="current-password"
              placeholder="Enter current password"
              required
              value={passwordData.current_password}
              onChange={handlePasswordChange}
            />

            <button
              type="button"
              onClick={requestPasswordCode}
              disabled={changingPassword}
            >
              <Mail size={17} />

              {changingPassword
                ? "Please wait..."
                : "Send Email Verification Code"}
            </button>

            {/* SHOW ONLY AFTER REQUESTING EMAIL CODE */}
            {codeRequested && (
              <>
                <label htmlFor="profile-code">
                  Six-Digit Email Code
                </label>

                <input
                  id="profile-code"
                  type="text"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  placeholder="Enter email code"
                  value={passwordData.code}
                  onChange={(event) =>
                    setPasswordData((old) => ({
                      ...old,
                      code: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6),
                    }))
                  }
                />

                <label htmlFor="profile-new-password">
                  New Password (10+ characters)
                </label>

                <input
                  id="profile-new-password"
                  type="password"
                  name="new_password"
                  minLength={10}
                  autoComplete="new-password"
                  required
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                />

                <label htmlFor="profile-confirm-password">
                  Confirm New Password
                </label>

                <input
                  id="profile-confirm-password"
                  type="password"
                  name="confirm_password"
                  autoComplete="new-password"
                  required
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                />

                <button
                  type="submit"
                  disabled={changingPassword}
                >
                  <Lock size={17} />

                  {changingPassword
                    ? "Verifying..."
                    : "Verify Code & Change Password"}
                </button>
              </>
            )}

            {passwordFeedback && (
              <p
                className="result-box"
                role="status"
              >
                {passwordFeedback}
              </p>
            )}
          </form>

          <div className="result-box security-note">
            <h3>Security Note</h3>

            <p>
              Enter your current password and
              verify the six-digit code sent to
              your registered email before choosing
              a new password. After changing it,
              you'll need to sign in again.
              Never share your code.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
