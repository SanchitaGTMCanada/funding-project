"use client";

import { useEffect, useMemo, useState } from "react";

export default function DashboardClient({ user }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [fundingServices, setFundingServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  // =========================================================
  // MANUAL ADD STATE
  // =========================================================

  const [showAddModal, setShowAddModal] = useState(false);
  const [addingData, setAddingData] = useState(false);

  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");

  const [addData, setAddData] = useState({
    "Program ID": "",
    "Program Name": "",
    Status: "",
    Category: "",
    Locations: "",
    Jurisdiction: "",
    "Funding Agency": "",
    Purpose: "",
    Eligibility: "",
    "Eligibility Details": "",
    "Amount Min": "",
    "Amount Max": "",
    "Funding Type": "",
    "Amount Notes": "",
    "Documents Needed": "",
    "Contact Information": "",
    "Official Source URL": "",
    "Source Category": "",
  });

  const [addMessage, setAddMessage] = useState("");
  const [addError, setAddError] = useState("");

  // =========================================================
  // EDIT STATE
  // =========================================================

  const [editingService, setEditingService] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editData, setEditData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");

  // =========================================================
  // DELETE STATE
  // =========================================================

  const [deletingService, setDeletingService] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // =========================================================
  // STATUS STATE
  // =========================================================

  const [statusConfirmingService, setStatusConfirmingService] =
    useState(null);

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [statusError, setStatusError] = useState("");

  // =========================================================
  // LOGOUT STATE
  // =========================================================

  const [loggingOut, setLoggingOut] = useState(false);

  // =========================================================
  // SEARCH
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");

  // =========================================================
  // ROLE
  // =========================================================

 const isSuperAdmin = user?.role === "SUPER_ADMIN";
const isEmployee = user?.role === "EMPLOYEE";

  // =========================================================
  // FETCH FUNDING SERVICES
  // =========================================================

  const fetchFundingServices = async () => {
    try {
      setLoadingServices(true);
      setUploadError("");

      const response = await fetch("/api/funding-services", {
        cache: "no-store",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load funding services"
        );
      }

      setFundingServices(result.fundingServices || []);
    } catch (error) {
      console.error("Fetch funding services error:", error);

      setUploadError(
        error.message || "Failed to load funding services."
      );
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchFundingServices();
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to logout"
        );
      }

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);

      alert(
        error.message ||
          "Failed to logout. Please try again."
      );

      setLoggingOut(false);
    }
  };

  // =========================================================
  // FILE SELECTION
  // =========================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setUploadMessage("");
    setUploadError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const fileName = file.name.toLowerCase();

    if (
      !fileName.endsWith(".xls") &&
      !fileName.endsWith(".xlsx")
    ) {
      setSelectedFile(null);

      setUploadError(
        "Please select a valid .xls or .xlsx file."
      );

      return;
    }

    setSelectedFile(file);
  };

  // =========================================================
  // UPLOAD EXCEL
  // =========================================================

  const handleExcelUpload = async () => {
    if (!selectedFile) {
      setUploadError(
        "Please select an Excel file first."
      );

      return;
    }

    setUploading(true);
    setUploadMessage("");
    setUploadError("");

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        "/api/funding-services/upload",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setUploadError(
          result.message ||
            "Failed to upload Excel file."
        );

        return;
      }

      setUploadMessage(
        result.message ||
          "Excel file uploaded successfully."
      );

      setSelectedFile(null);

      const fileInput =
        document.getElementById("excel-upload");

      if (fileInput) {
        fileInput.value = "";
      }

      await fetchFundingServices();
    } catch (error) {
      console.error("Excel upload error:", error);

      setUploadError(
        "Something went wrong while uploading the Excel file."
      );
    } finally {
      setUploading(false);
    }
  };

  // =========================================================
  // DYNAMIC COLUMNS
  // =========================================================

  const dynamicColumns = useMemo(() => {
    const columns = [];

    fundingServices.forEach((service) => {
      if (
        !service.data ||
        typeof service.data !== "object"
      ) {
        return;
      }

      Object.keys(service.data).forEach((key) => {
        if (!columns.includes(key)) {
          columns.push(key);
        }
      });
    });

    return columns;
  }, [fundingServices]);

  // =========================================================
  // FILTER SERVICES
  // =========================================================

  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) {
      return fundingServices;
    }

    const search = searchTerm
      .toLowerCase()
      .trim();

    return fundingServices.filter((service) => {
      const values = [
        service.title,
        service.description,
        ...Object.values(service.data || {}),
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [fundingServices, searchTerm]);

  // =========================================================
  // FORMAT VALUES
  // =========================================================

  const formatValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  // =========================================================
  // MANUAL ADD
  // =========================================================

  const handleOpenAddModal = () => {
    setShowAddModal(true);

    setAddTitle("");
    setAddDescription("");

    setAddData({
      "Program ID": "",
      "Program Name": "",
      Status: "",
      Category: "",
      Locations: "",
      Jurisdiction: "",
      "Funding Agency": "",
      Purpose: "",
      Eligibility: "",
      "Eligibility Details": "",
      "Amount Min": "",
      "Amount Max": "",
      "Funding Type": "",
      "Amount Notes": "",
      "Documents Needed": "",
      "Contact Information": "",
      "Official Source URL": "",
      "Source Category": "",
    });

    setAddMessage("");
    setAddError("");
  };

  const handleCloseAddModal = () => {
    if (addingData) {
      return;
    }

    setShowAddModal(false);

    setAddTitle("");
    setAddDescription("");
    setAddData({});
    setAddMessage("");
    setAddError("");
  };

  const handleAddFieldChange = (
    field,
    value
  ) => {
    setAddData((previousData) => ({
      ...previousData,
      [field]: value,
    }));
  };

  const handleAddNewField = () => {
    const newField = window.prompt(
      "Enter the field name:"
    );

    if (!newField || !newField.trim()) {
      return;
    }

    const fieldName = newField.trim();

    const fieldExists =
      Object.keys(addData).some(
        (field) =>
          field.toLowerCase() ===
          fieldName.toLowerCase()
      );

    if (fieldExists) {
      setAddError(
        "This field already exists."
      );

      return;
    }

    setAddData((previousData) => ({
      ...previousData,
      [fieldName]: "",
    }));

    setAddError("");
  };

  const handleRemoveAddField = (field) => {
    setAddData((previousData) => {
      const updatedData = {
        ...previousData,
      };

      delete updatedData[field];

      return updatedData;
    });
  };

  const handleSaveManualData = async () => {
    if (!String(addData["Program Name"] || "").trim()) {
      setAddError(
        "Program Name is required."
      );

      return;
    }

    setAddingData(true);
    setAddMessage("");
    setAddError("");

    try {
      const response = await fetch(
        "/api/funding-services",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: String(
              addData["Program Name"] || ""
            ).trim(),
            description:
              String(addData["Purpose"] || "").trim() ||
              null,
            data: addData,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setAddError(
          result.message ||
            "Failed to add funding data."
        );

        return;
      }

      setAddMessage(
        result.message ||
          "Funding data added successfully."
      );

      await fetchFundingServices();

      setTimeout(() => {
        setShowAddModal(false);

        setAddTitle("");
        setAddDescription("");
        setAddData({});
        setAddMessage("");
        setAddError("");
      }, 700);
    } catch (error) {
      console.error(
        "Add funding data error:",
        error
      );

      setAddError(
        "Something went wrong while adding funding data."
      );
    } finally {
      setAddingData(false);
    }
  };

  // =========================================================
  // EDIT
  // =========================================================

  const handleEdit = (service) => {
    setEditingService(service);

    setEditTitle(service.title || "");

    setEditDescription(
      service.description || ""
    );

    setEditData({
      ...(service.data || {}),
    });

    setEditMessage("");
    setEditError("");
  };

  const handleCloseEdit = () => {
    if (savingEdit) {
      return;
    }

    setEditingService(null);
    setEditTitle("");
    setEditDescription("");
    setEditData({});
    setEditMessage("");
    setEditError("");
  };

  const handleEditFieldChange = (
    field,
    value
  ) => {
    setEditData((previousData) => ({
      ...previousData,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingService) {
      return;
    }

    if (!editTitle.trim()) {
      setEditError(
        "Funding service title is required."
      );

      return;
    }

    setSavingEdit(true);
    setEditMessage("");
    setEditError("");

    try {
      const response = await fetch(
        `/api/funding-services/${editingService.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: editTitle.trim(),
            description:
              editDescription.trim() || null,
            data: editData,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setEditError(
          result.message ||
            "Failed to update funding service."
        );

        return;
      }

      setEditMessage(
        result.message ||
          "Funding service updated successfully."
      );

      await fetchFundingServices();

      setTimeout(() => {
        handleCloseEdit();
      }, 500);
    } catch (error) {
      console.error(
        "Update funding service error:",
        error
      );

      setEditError(
        "Something went wrong while updating the funding service."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================================================
  // URL HELPERS
  // =========================================================

  const isUrlValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      typeof value === "object"
    ) {
      return false;
    }

    const text = String(value).trim();

    if (!text) {
      return false;
    }

    return /^(https?:\/\/|www\.)\S+$/i.test(text);
  };

  const getUrlHref = (value) => {
    const text = String(value).trim();

    if (/^www\./i.test(text)) {
      return `https://${text}`;
    }

    return text;
  };

  const renderValue = (value) => {
    const formattedValue = formatValue(value);

    if (!isUrlValue(value)) {
      return formattedValue;
    }

    return (
      <a
        href={getUrlHref(value)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="inline-flex max-w-full items-center gap-1.5 truncate font-semibold text-indigo-600 underline decoration-indigo-300 underline-offset-2 transition hover:text-indigo-800 hover:decoration-indigo-500"
        title={formattedValue}
      >
        <span className="truncate">
          {formattedValue}
        </span>

        <svg
          className="shrink-0"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 3h7v7" />
          <path d="M10 14 21 3" />
          <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
        </svg>
      </a>
    );
  };

  // =========================================================
  // STATUS / ACTIVE-INACTIVE
  // =========================================================


  // =========================================================
// CLOSE ALL FUNDING MODALS
// =========================================================

const closeAllFundingModals = () => {
  // Edit modal
  setEditingService(null);
  setEditTitle("");
  setEditDescription("");
  setEditData({});
  setEditMessage("");
  setEditError("");

  // Delete modal
  setDeletingService(null);
  setDeleteError("");

  // Activate / Deactivate confirmation modal
  setStatusConfirmingService(null);
  setStatusError("");

  // Add modal
  setShowAddModal(false);
  setAddTitle("");
  setAddDescription("");
  setAddData({});
  setAddMessage("");
  setAddError("");
};

const handleOpenStatusConfirmation = (service) => {
  if (!isEmployee && !isSuperAdmin) {
    return;
  }

  setStatusConfirmingService(service);
  setStatusError("");
};

  const handleCloseStatusConfirmation = () => {
    if (statusUpdatingId !== null) {
      return;
    }

    setStatusConfirmingService(null);
    setStatusError("");
  };

const handleToggleStatus = async () => {
  if (
    !statusConfirmingService ||
    (!isEmployee && !isSuperAdmin)
  ) {
    return;
  }

  const service = statusConfirmingService;
  const nextIsActive = !service.isActive;

  setStatusUpdatingId(service.id);
  setStatusError("");
  setUploadError("");

  try {
    const response = await fetch(
      `/api/funding-services/${service.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          isActive: nextIsActive,
        }),
      }
    );

    const responseText = await response.text();

    let result = {};

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "Funding status response JSON parse error:",
          parseError
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        result.message ||
          `Failed to update funding program status (${response.status}).`
      );
    }

    // =====================================================
    // UPDATE TABLE DATA
    // =====================================================

    setFundingServices((currentServices) =>
      currentServices.map((item) =>
        item.id === service.id
          ? {
              ...item,
              isActive:
                result.fundingService?.isActive ??
                nextIsActive,
              updatedAt:
                result.fundingService?.updatedAt ??
                item.updatedAt,
            }
          : item
      )
    );

    // =====================================================
    // CLOSE ALL MODALS AFTER SUCCESS
    // =====================================================

    closeAllFundingModals();
  } catch (error) {
    console.error(
      "Toggle funding service status error:",
      error
    );

    setStatusError(
      error?.message ||
        "Failed to update funding program status."
    );
  } finally {
    setStatusUpdatingId(null);
  }
};
  // =========================================================
  // DELETE
  // =========================================================

  const handleOpenDelete = (service) => {
    setDeletingService(service);
    setDeleteError("");
  };

  const handleCloseDelete = () => {
    if (deleting) {
      return;
    }

    setDeletingService(null);
    setDeleteError("");
  };

 const handleDelete = async () => {
  if (!deletingService) {
    return;
  }

  setDeleting(true);
  setDeleteError("");

  try {
    const response = await fetch(
      `/api/funding-services/${deletingService.id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const responseText = await response.text();

    let result = {};

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "Delete response JSON parse error:",
          parseError
        );
      }
    }

    if (!response.ok) {
      setDeleteError(
        result.message ||
          `Failed to delete funding service (${response.status}).`
      );

      return;
    }

    // =====================================================
    // REFRESH TABLE
    // =====================================================

    await fetchFundingServices();

    // =====================================================
    // CLOSE ALL MODALS AFTER SUCCESS
    // =====================================================

    closeAllFundingModals();
  } catch (error) {
    console.error(
      "Delete funding service error:",
      error
    );

    setDeleteError(
      error?.message ||
        "Something went wrong while deleting the funding service."
    );
  } finally {
    setDeleting(false);
  }
};

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-violet-200/20 blur-3xl" />
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 lg:px-8">

          {/* Brand */}
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 shadow-lg shadow-indigo-200">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V9l7-5 7 5v12" />
                <path d="M9 21v-6h6v6" />
                <path d="M9 10h.01" />
                <path d="M15 10h.01" />
              </svg>
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                Funding Management
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Funding services administration
              </p>
            </div>

          </div>

          {/* User area */}
          <div className="flex items-center gap-2 sm:gap-3">

            <div className="hidden rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Signed in as
              </p>

              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {user?.email}
              </p>
            </div>

            <div
              className={`rounded-xl px-3 py-2 text-xs font-bold tracking-wide ${
                isSuperAdmin
                  ? "bg-violet-100 text-violet-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {isSuperAdmin
                ? "SUPER ADMIN"
                : "EMPLOYEE"}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line
                  x1="21"
                  y1="12"
                  x2="9"
                  y2="12"
                />
              </svg>

              <span className="hidden sm:inline">
                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8 lg:py-10">

        {/* Hero */}
        <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 shadow-2xl shadow-slate-200 sm:p-8 lg:p-10">

          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="absolute -bottom-28 right-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              Administration Portal
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Manage your funding
              <span className="block bg-gradient-to-r from-indigo-300 via-cyan-200 to-white bg-clip-text text-transparent">
                opportunities with ease.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Import, manually add, manage and maintain funding opportunities from one centralized dashboard.
            </p>

          </div>
        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total programs */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Programs
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {fundingServices.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                  />
                  <path d="M7 8h10" />
                  <path d="M7 12h10" />
                  <path d="M7 16h6" />
                </svg>
              </div>

            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-3/4 rounded-full bg-indigo-500 transition-all group-hover:w-full" />
            </div>
          </div>

          {/* Data fields */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Data Fields
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {dynamicColumns.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 5h16" />
                  <path d="M4 12h16" />
                  <path d="M4 19h16" />
                  <circle cx="8" cy="5" r="1" />
                  <circle cx="16" cy="12" r="1" />
                  <circle cx="10" cy="19" r="1" />
                </svg>
              </div>

            </div>

            <p className="mt-4 text-xs text-slate-400">
              Imported and manually entered fields
            </p>
          </div>

          {/* Role */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Access Level
                </p>

                <p className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                  {isSuperAdmin
                    ? "Full Access"
                    : "Editor Access"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>

            </div>

            <p className="mt-4 text-xs text-slate-400">
              {isSuperAdmin
                ? "Create, edit, activate, deactivate and delete"
                : "Create and edit"}
            </p>
          </div>

          {/* Status */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  System Status
                </p>

                <p className="mt-2 text-xl font-bold tracking-tight text-emerald-600">
                  Operational
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-300" />
              </div>

            </div>

            <p className="mt-4 text-xs text-slate-400">
              Database connection active
            </p>
          </div>

        </div>

 {/* =====================================================
    IMPORT / MANUAL ENTRY CARD
===================================================== */}

<div className="mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

  {/* HEADER */}

  <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

      <div>
        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m7 8 5-5 5 5" />
              <path d="M5 21h14" />
              <path d="M5 17h14" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-950">
              Add Funding Data
            </h3>

            <p className="text-sm text-slate-500">
              {isSuperAdmin
                ? "Import from Excel or enter a funding opportunity manually."
                : "Enter a new funding opportunity manually."}
            </p>
          </div>

        </div>
      </div>

      <div className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
        {isSuperAdmin
          ? "ADMIN DATA ENTRY"
          : "EMPLOYEE DATA ENTRY"}
      </div>

    </div>
  </div>

  {/* BODY */}

  <div className="p-6 sm:p-7">

    <div
      className={
        isSuperAdmin
          ? "grid gap-4 lg:grid-cols-2"
          : "grid gap-4"
      }
    >

      {/* =================================================
          EXCEL UPLOAD
          SUPER ADMIN ONLY
      ================================================= */}

      {isSuperAdmin && (
        <label
          htmlFor="excel-upload"
          className={`group relative flex min-h-[125px] cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-5 transition ${
            selectedFile
              ? "border-indigo-300 bg-indigo-50/50"
              : "border-slate-200 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40"
          }`}
        >

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
              />
            </svg>
          </div>

          <div className="min-w-0">

            <p className="font-semibold text-slate-800">
              {selectedFile
                ? selectedFile.name
                : "Choose an Excel file"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {selectedFile
                ? "Ready to upload"
                : "Upload .xls or .xlsx data"}
            </p>

          </div>

          <input
            id="excel-upload"
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

        </label>
      )}

      {/* =================================================
          MANUAL ENTRY
      ================================================= */}

      <button
        type="button"
        onClick={handleOpenAddModal}
        className="
          group
          relative
          flex
          min-h-[125px]
          w-full
          items-center
          gap-4
          rounded-2xl
          border-2
          border-dashed
          border-cyan-200
          bg-gradient-to-br
          from-cyan-50/70
          to-indigo-50/60
          p-5
          text-left
          transition
          hover:-translate-y-0.5
          hover:border-indigo-300
          hover:from-indigo-50
          hover:to-cyan-50
        "
      >

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm transition group-hover:scale-105">

          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />

            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>

        </div>

        <div className="min-w-0">

          <p className="font-semibold text-slate-900">
            Add Data Manually
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Enter a new funding opportunity directly
            into the system.
          </p>

        </div>

        <div className="ml-auto hidden rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm sm:block">
          + ADD
        </div>

      </button>

    </div>

    {/* =================================================
        EXCEL UPLOAD ACTION
        SUPER ADMIN ONLY
    ================================================= */}

    {isSuperAdmin && (
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">

        <button
          type="button"
          onClick={handleExcelUpload}
          disabled={
            !selectedFile || uploading
          }
          className="
            flex
            min-h-[56px]
            items-center
            justify-center
            gap-2
            rounded-2xl
            bg-gradient-to-r
            from-indigo-600
            to-violet-600
            px-7
            text-sm
            font-bold
            text-white
            shadow-lg
            shadow-indigo-200
            transition
            hover:-translate-y-0.5
            hover:from-indigo-700
            hover:to-violet-700
            disabled:cursor-not-allowed
            disabled:opacity-40
            disabled:hover:translate-y-0
          "
        >

          {uploading ? (
            <>
              <svg
                className="animate-spin"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="3"
                  opacity="0.3"
                />

                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              Uploading...
            </>
          ) : (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12" />
                <path d="m7 8 5-5 5 5" />
                <path d="M5 21h14" />
              </svg>

              Upload Excel
            </>
          )}

        </button>

        <p className="text-xs text-slate-400">
          Only Super Admins can import funding data
          through Excel.
        </p>

      </div>
    )}

    {/* =================================================
        SUCCESS MESSAGE
    ================================================= */}

    {uploadMessage && (
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">

        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          ✓
        </div>

        <p className="text-sm font-semibold text-emerald-700">
          {uploadMessage}
        </p>

      </div>
    )}

    {/* =================================================
        ERROR MESSAGE
    ================================================= */}

    {uploadError && (
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">

        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          !
        </div>

        <p className="text-sm font-semibold text-red-700">
          {uploadError}
        </p>

      </div>
    )}

  </div>
</div>
                {/* =====================================================
            FUNDING TABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* Table top */}
          <div className="border-b border-slate-100 px-6 py-5 sm:px-7">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                      />

                      <path d="M3 9h18" />

                      <path d="M9 21V9" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-950">
                      Funding Services
                    </h3>

                    <p className="mt-0.5 text-sm text-slate-500">
                      {filteredServices.length} of{" "}
                      {fundingServices.length} opportunities
                    </p>
                  </div>

                </div>

              </div>

              {/* Search */}
              <div className="relative w-full lg:max-w-sm">

                <svg
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path d="m20 20-4-4" />
                </svg>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Search funding programs..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />

              </div>

            </div>

          </div>

          {/* Loading */}
          {loadingServices ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">

                <svg
                  className="animate-spin text-indigo-600"
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    opacity="0.2"
                  />

                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>

              </div>

              <p className="mt-4 text-sm font-semibold text-slate-600">
                Loading funding services...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait a moment
              </p>

            </div>

          ) : fundingServices.length === 0 ? (

            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                  />

                  <path d="M8 8h8" />
                  <path d="M8 12h8" />
                  <path d="M8 16h5" />
                </svg>

              </div>

              <h4 className="mt-5 font-bold text-slate-800">
                No funding programs yet
              </h4>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Upload an Excel file or use Add Data Manually above to create your first funding opportunity.
              </p>

            </div>

          ) : filteredServices.length === 0 ? (

            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path d="m20 20-4-4" />
                </svg>

              </div>

              <p className="mt-4 font-semibold text-slate-700">
                No matching programs
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try a different search term.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-max text-left text-sm">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50/80">

                    {/* ID */}
                    <th className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      ID
                    </th>

                    {/* Funding Service */}
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                      Funding Service Title
                    </th>

                    {/* Dynamic columns */}
                    {dynamicColumns.map(
                      (column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          {column}
                        </th>
                      )
                    )}

                    {/* Status */}
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    {/* Created */}
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Created
                    </th>

                    {/* Updated */}
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Updated
                    </th>

                    {/* Actions */}
                    <th className="sticky right-0 z-20 border-l border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-200/80">

                  {filteredServices.map(
                    (service, index) => (

                      <tr
                        key={service.id}
                        className={`group transition ${
                          index % 2 === 0
                            ? "bg-white hover:bg-slate-100/80"
                            : "bg-slate-50/70 hover:bg-slate-100"
                        }`}
                      >

                        {/* =================================================
                            ID
                        ================================================= */}

                        <td
                          className={`sticky left-0 z-10 border-r border-slate-200 px-5 py-4 ${
                            index % 2 === 0
                              ? "bg-white group-hover:bg-slate-100/80"
                              : "bg-slate-50/70 group-hover:bg-slate-100"
                          }`}
                        >

                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-bold text-slate-700">
                            #{service.id}
                          </span>

                        </td>

                        {/* =================================================
                            FUNDING SERVICE TITLE
                        ================================================= */}

                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                          {service.title || "-"}
                        </td>

                        {/* =================================================
                            DYNAMIC FIELDS
                        ================================================= */}

                        {dynamicColumns.map(
                          (column) => (

                            <td
                              key={`${service.id}-${column}`}
                              className="max-w-[320px] whitespace-nowrap px-5 py-4 text-slate-600"
                              title={formatValue(
                                service.data?.[column]
                              )}
                            >

                              <div className="max-w-[320px] truncate">
                                {renderValue(
                                  service.data?.[column]
                                )}
                              </div>

                            </td>

                          )
                        )}

                        {/* =================================================
                            STATUS
                        ================================================= */}

                        <td className="whitespace-nowrap px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                              service.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >

                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                service.isActive
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />

                            {service.isActive
                              ? "Active"
                              : "Inactive"}

                          </span>

                        </td>

                        {/* =================================================
                            CREATED
                        ================================================= */}

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">

                          {service.createdAt
                            ? new Date(
                                service.createdAt
                              ).toLocaleString()
                            : "-"}

                        </td>

                        {/* =================================================
                            UPDATED
                        ================================================= */}

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">

                          {service.updatedAt
                            ? new Date(
                                service.updatedAt
                              ).toLocaleString()
                            : "-"}

                        </td>

                        {/* =================================================
                            ACTIONS
                        ================================================= */}

                       {/* =================================================
    ACTIONS
================================================= */}

<td
  className={`sticky right-0 z-10 border-l border-slate-200 px-5 py-4 ${
    index % 2 === 0
      ? "bg-white group-hover:bg-slate-100/80"
      : "bg-slate-50/70 group-hover:bg-slate-100"
  }`}
>
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => handleEdit(service)}
      className="
        flex
        items-center
        gap-1.5
        rounded-lg
        bg-slate-900
        px-3.5
        py-2
        text-xs
        font-bold
        text-white
        shadow-sm
        transition
        hover:bg-indigo-600
      "
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>

      Edit
    </button>
  </div>
</td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>

      {/* =====================================================
          ADD DATA MODAL
      ===================================================== */}

      {showAddModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !addingData
            ) {
              handleCloseAddModal();
            }
          }}
        >

          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">

            {/* HEADER */}
            <div className="relative shrink-0 overflow-hidden bg-[#071a2d] px-6 py-6 text-white sm:px-8">

              <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />

              <div className="absolute bottom-[-100px] left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative flex items-center justify-between gap-4">

                <div>

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-200">

                    <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />

                    Funding Data

                  </div>

                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Add Funding Opportunity
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Enter the funding information using the standard fields from the funding database.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={addingData}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>

                </button>

              </div>

            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto">

              <div className="p-6 sm:p-8">

                {/* Basic information */}
                <div className="mb-8">

                  <div className="mb-5">

                    <h3 className="text-base font-bold text-slate-950">
                      Basic Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Provide the primary details for this funding opportunity.
                    </p>

                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    {/* Program ID */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Program ID
                      </label>

                      <input
                        type="text"
                        value={addData["Program ID"] || ""}
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Program ID",
                            event.target.value
                          )
                        }
                        placeholder="Enter program ID"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Program Name */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Program Name
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        value={addData["Program Name"] || ""}
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Program Name",
                            event.target.value
                          )
                        }
                        placeholder="Enter program name"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Status */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Status
                      </label>

                      <input
                        type="text"
                        value={addData.Status || ""}
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Status",
                            event.target.value
                          )
                        }
                        placeholder="Enter status"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Category */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Category
                      </label>

                      <input
                        type="text"
                        value={addData.Category || ""}
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Category",
                            event.target.value
                          )
                        }
                        placeholder="Enter category"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Locations */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Locations
                      </label>

                      <input
                        type="text"
                        value={addData.Locations || ""}
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Locations",
                            event.target.value
                          )
                        }
                        placeholder="Enter locations"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Jurisdiction */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Jurisdiction
                      </label>

                      <input
                        type="text"
                        value={addData.Jurisdiction || ""}
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Jurisdiction",
                            event.target.value
                          )
                        }
                        placeholder="Enter jurisdiction"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Funding Agency */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Funding Agency
                      </label>

                      <input
                        type="text"
                        value={
                          addData["Funding Agency"] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Funding Agency",
                            event.target.value
                          )
                        }
                        placeholder="Enter funding agency"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Source Category */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Source Category
                      </label>

                      <input
                        type="text"
                        value={
                          addData["Source Category"] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Source Category",
                            event.target.value
                          )
                        }
                        placeholder="Enter source category"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                  </div>

                </div>

                {/* Funding details */}
                <div className="mb-8">

                  <div className="mb-5">

                    <h3 className="text-base font-bold text-slate-950">
                      Funding Details
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Add information about the funding amount, purpose and type.
                    </p>

                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    {/* Purpose */}
                    <div className="md:col-span-2">

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Purpose
                      </label>

                      <textarea
                        value={addData.Purpose || ""}
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Purpose",
                            event.target.value
                          )
                        }
                        rows={4}
                        placeholder="Describe the purpose of this funding program"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Funding Type */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Funding Type
                      </label>

                      <input
                        type="text"
                        value={
                          addData["Funding Type"] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Funding Type",
                            event.target.value
                          )
                        }
                        placeholder="Grant, loan, subsidy..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Amount Notes */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Amount Notes
                      </label>

                      <input
                        type="text"
                        value={
                          addData["Amount Notes"] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Amount Notes",
                            event.target.value
                          )
                        }
                        placeholder="Additional amount information"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Amount Min */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Amount Min
                      </label>

                      <input
                        type="text"
                        value={
                          addData["Amount Min"] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Amount Min",
                            event.target.value
                          )
                        }
                        placeholder="Minimum funding amount"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Amount Max */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Amount Max
                      </label>

                      <input
                        type="text"
                        value={
                          addData["Amount Max"] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Amount Max",
                            event.target.value
                          )
                        }
                        placeholder="Maximum funding amount"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                  </div>

                </div>

                {/* Eligibility */}
                <div className="mb-8">

                  <div className="mb-5">

                    <h3 className="text-base font-bold text-slate-950">
                      Eligibility
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Specify who can qualify and any additional requirements.
                    </p>

                  </div>

                  <div className="grid gap-5">

                    {/* Eligibility */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Eligibility
                      </label>

                      <textarea
                        value={
                          addData.Eligibility || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Eligibility",
                            event.target.value
                          )
                        }
                        rows={3}
                        placeholder="Who is eligible for this program?"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Eligibility Details */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Eligibility Details
                      </label>

                      <textarea
                        value={
                          addData[
                            "Eligibility Details"
                          ] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Eligibility Details",
                            event.target.value
                          )
                        }
                        rows={4}
                        placeholder="Add detailed eligibility requirements"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Documents */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Documents Needed
                      </label>

                      <textarea
                        value={
                          addData[
                            "Documents Needed"
                          ] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Documents Needed",
                            event.target.value
                          )
                        }
                        rows={4}
                        placeholder="List required documents"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                  </div>

                </div>

                {/* Contact and source */}
                <div>

                  <div className="mb-5">

                    <h3 className="text-base font-bold text-slate-950">
                      Contact & Source
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Add contact information and the official source.
                    </p>

                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    {/* Contact */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Contact Information
                      </label>

                      <textarea
                        value={
                          addData[
                            "Contact Information"
                          ] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Contact Information",
                            event.target.value
                          )
                        }
                        rows={4}
                        placeholder="Phone, email, office..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                    {/* Official Source URL */}
                    <div>

                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Official Source URL
                      </label>

                      <input
                        type="url"
                        value={
                          addData[
                            "Official Source URL"
                          ] || ""
                        }
                        onChange={(event) =>
                          handleAddFieldChange(
                            "Official Source URL",
                            event.target.value
                          )
                        }
                        placeholder="https://example.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />

                    </div>

                  </div>

                </div>

                {/* Add custom field */}
                <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">

                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                    <div>

                      <p className="text-sm font-bold text-slate-800">
                        Need another field?
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Add a custom field if the standard fields don't cover your data.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={handleAddNewField}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
                    >

                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                        />

                        <path d="M12 8v8" />
                        <path d="M8 12h8" />
                      </svg>

                      Add Custom Field

                    </button>

                  </div>

                </div>

                {/* Add errors */}
                {addError && (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">

                    <div className="flex items-start gap-3">

                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        !
                      </div>

                      <p className="text-sm font-semibold text-red-700">
                        {addError}
                      </p>

                    </div>

                  </div>
                )}

                {/* Add success */}
                {addMessage && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">

                    <div className="flex items-start gap-3">

                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        ✓
                      </div>

                      <p className="text-sm font-semibold text-emerald-700">
                        {addMessage}
                      </p>

                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* FOOTER */}
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:px-8">

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={addingData}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveManualData}
                  disabled={addingData}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {addingData ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />

                        <polyline points="17 21 17 13 7 13 7 21" />

                        <polyline points="7 3 7 8 15 8" />
                      </svg>

                      Save Funding Program
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}
              {/* =====================================================
            EDIT FUNDING PROGRAM MODAL
        ===================================================== */}

        {editingService && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !savingEdit
              ) {
                handleCloseEdit();
              }
            }}
          >
            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">

              {/* =================================================
                  EDIT MODAL HEADER
              ================================================= */}

              <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-6 py-6 text-white sm:px-8">

                <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

                <div className="absolute bottom-[-100px] left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

                <div className="relative flex items-center justify-between gap-4">

                  <div>

                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200">

                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />

                      Edit Funding Data

                    </div>

                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      Edit Funding Opportunity
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      Update the funding information and save your changes.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    disabled={savingEdit}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-xl text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Close"
                  >
                    ×
                  </button>

                </div>

              </div>

              {/* =================================================
                  EDIT MODAL BODY
              ================================================= */}

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">

                {/* =================================================
                    BASIC INFORMATION
                ================================================= */}

                <div className="mb-8">

                  <div className="mb-5">

                    <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
                      Basic Information
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Update the funding program title and description.
                    </p>

                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    {/* Title */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_3px_15px_rgba(15,23,42,0.04)]">

                      <label className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                        Funding Service Title
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        value={editTitle}
                        onChange={(event) =>
                          setEditTitle(
                            event.target.value
                          )
                        }
                        placeholder="Enter funding service title"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafb] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      />

                    </div>

                    {/* Description */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_3px_15px_rgba(15,23,42,0.04)]">

                      <label className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                        Description
                      </label>

                      <textarea
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(
                            event.target.value
                          )
                        }
                        rows={3}
                        placeholder="Enter funding service description"
                        className="w-full resize-y rounded-xl border border-slate-200 bg-[#f8fafb] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      />

                    </div>

                  </div>

                </div>

                {/* =================================================
                    FUNDING FIELDS
                ================================================= */}

                <div>

                  <div className="mb-5">

                    <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
                      Funding Fields
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Edit the imported or manually entered funding information.
                    </p>

                  </div>

                  {Object.keys(editData).length === 0 ? (

                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">

                      <p className="text-sm font-semibold text-slate-600">
                        No additional funding fields available.
                      </p>

                    </div>

                  ) : (

                    <div className="grid gap-5 md:grid-cols-2">

                      {Object.entries(editData).map(
                        ([field, value]) => {

                          const isUrl =
                            field ===
                            "Official Source URL";

                          const displayValue =
                            value === null ||
                            value === undefined
                              ? ""
                              : typeof value ===
                                  "object"
                                ? JSON.stringify(
                                    value
                                  )
                                : String(value);

                          const hasValidUrl =
                            isUrl &&
                            displayValue.trim() &&
                            /^(https?:\/\/|www\.)\S+$/i.test(
                              displayValue.trim()
                            );

                          const urlHref =
                            hasValidUrl
                              ? /^www\./i.test(
                                  displayValue.trim()
                                )
                                ? `https://${displayValue.trim()}`
                                : displayValue.trim()
                              : "";

                          const isLongField = [
                            "Purpose",
                            "Eligibility",
                            "Eligibility Details",
                            "Amount Notes",
                            "Documents Needed",
                            "Contact Information",
                          ].includes(field);

                          return (
                            <div
                              key={field}
                              className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_3px_15px_rgba(15,23,42,0.04)] transition hover:border-indigo-200 hover:shadow-[0_8px_25px_rgba(15,23,42,0.07)] ${
                                isLongField
                                  ? "md:col-span-2"
                                  : ""
                              }`}
                            >

                              <div className="mb-3 flex items-center justify-between gap-3">

                                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                                  {field}
                                </label>

                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-400">
                                  FIELD
                                </span>

                              </div>

                              {isLongField ? (

                                <textarea
                                  value={displayValue}
                                  onChange={(event) =>
                                    handleEditFieldChange(
                                      field,
                                      event.target.value
                                    )
                                  }
                                  rows={
                                    field ===
                                    "Eligibility Details"
                                      ? 5
                                      : 4
                                  }
                                  placeholder={`Enter ${field.toLowerCase()}`}
                                  className="w-full resize-y rounded-xl border border-slate-200 bg-[#f8fafb] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                />

                              ) : (

                                <input
                                  type={
                                    isUrl
                                      ? "url"
                                      : "text"
                                  }
                                  value={displayValue}
                                  onChange={(event) =>
                                    handleEditFieldChange(
                                      field,
                                      event.target.value
                                    )
                                  }
                                  placeholder={`Enter ${field.toLowerCase()}`}
                                  className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafb] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                                />

                              )}

                              {/* Official URL */}
                              {hasValidUrl && (
                                <div className="mt-3">

                                  <a
                                    href={urlHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) =>
                                      event.stopPropagation()
                                    }
                                    className="inline-flex max-w-full items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 hover:text-indigo-800"
                                  >

                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M14 3h7v7" />
                                      <path d="M10 14 21 3" />
                                      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                                    </svg>

                                    Open Official Source

                                  </a>

                                </div>
                              )}

                            </div>
                          );
                        }
                      )}

                    </div>

                  )}

                </div>

                {/* =================================================
                    EDIT ERROR
                ================================================= */}

                {editError && (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      !
                    </div>

                    <p className="pt-1 text-sm font-semibold text-red-700">
                      {editError}
                    </p>

                  </div>
                )}

                {/* =================================================
                    EDIT SUCCESS
                ================================================= */}

                {editMessage && (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                      ✓
                    </div>

                    <p className="pt-1 text-sm font-semibold text-emerald-700">
                      {editMessage}
                    </p>

                  </div>
                )}

              </div>

              {/* =================================================
                  EDIT FOOTER
              ================================================= */}

          {/* =================================================
    EDIT FOOTER
================================================= */}

<div className="flex shrink-0 flex-col gap-4 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">

  {/* LEFT SIDE - DANGER / STATUS ACTIONS */}

  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

    <div className="flex flex-wrap items-center gap-3">

      {/* ACTIVATE / DEACTIVATE */}

      {(isEmployee || isSuperAdmin) && (
        <button
          type="button"
          onClick={() =>
            handleOpenStatusConfirmation(
              editingService
            )
          }
          disabled={
            statusUpdatingId ===
              editingService?.id ||
            savingEdit ||
            deleting
          }
          className={`
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            px-4
            py-2.5
            text-sm
            font-bold
            transition
            disabled:cursor-not-allowed
            disabled:opacity-50

            ${
              editingService?.isActive
                ? `
                  border-amber-200
                  bg-amber-50
                  text-amber-700
                  hover:border-amber-300
                  hover:bg-amber-100
                `
                : `
                  border-emerald-200
                  bg-emerald-50
                  text-emerald-700
                  hover:border-emerald-300
                  hover:bg-emerald-100
                `
            }
          `}
        >
          {editingService?.isActive ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect
                  width="18"
                  height="18"
                  x="3"
                  y="3"
                  rx="2"
                />

                <path d="M9 9l6 6" />
                <path d="m15 9-6 6" />
              </svg>

              Deactivate
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>

              Activate
            </>
          )}
        </button>
      )}

      {/* DELETE */}

      {(isEmployee || isSuperAdmin) && (
        <button
          type="button"
          onClick={() =>
            handleOpenDelete(editingService)
          }
          disabled={
            deleting ||
            savingEdit ||
            statusUpdatingId ===
              editingService?.id
          }
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-2.5
            text-sm
            font-bold
            text-red-600
            transition
            hover:border-red-300
            hover:bg-red-100
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>

          Delete
        </button>
      )}

    </div>

    {/* RIGHT SIDE - SAVE / CANCEL */}

    <div className="flex flex-col gap-3 sm:flex-row">

      <button
        type="button"
        onClick={handleCloseEdit}
        disabled={
          savingEdit ||
          deleting ||
          statusUpdatingId !== null
        }
        className="
          rounded-xl
          border
          border-slate-200
          bg-white
          px-6
          py-3
          text-sm
          font-bold
          text-slate-600
          transition
          hover:bg-slate-100
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleSaveEdit}
        disabled={
          savingEdit ||
          deleting ||
          statusUpdatingId !== null
        }
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-[#071a2d]
          px-7
          py-3
          text-sm
          font-bold
          text-white
          shadow-lg
          transition
          hover:bg-indigo-600
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {savingEdit ? (
          <>
            <svg
              className="animate-spin"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.25"
              />

              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>

            Saving...
          </>
        ) : (
          <>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>

            Save Changes
          </>
        )}
      </button>

    </div>

  </div>
</div>
            </div>
          </div>
        )}

        {/* =====================================================
            ACTIVE / INACTIVE CONFIRMATION MODAL
        ===================================================== */}

        {statusConfirmingService && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                statusUpdatingId === null
              ) {
                handleCloseStatusConfirmation();
              }
            }}
          >

            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">

              {/* =================================================
                  STATUS MODAL HEADER
              ================================================= */}

              <div className="border-b border-slate-100 px-6 py-6">

                <div className="flex items-start gap-4">

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      statusConfirmingService.isActive
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >

                    {statusConfirmingService.isActive ? (
                      <svg
                        width="23"
                        height="23"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          width="18"
                          height="18"
                          x="3"
                          y="3"
                          rx="2"
                        />

                        <path d="M9 9l6 6" />
                        <path d="m15 9-6 6" />
                      </svg>
                    ) : (
                      <svg
                        width="23"
                        height="23"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}

                  </div>

                  <div className="min-w-0">

                    <h3 className="text-lg font-bold text-slate-950">
                      {statusConfirmingService.isActive
                        ? "Deactivate Funding Program?"
                        : "Activate Funding Program?"}
                    </h3>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {statusConfirmingService.title}
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  STATUS MODAL BODY
              ================================================= */}

              <div className="px-6 py-6">

                {statusConfirmingService.isActive ? (

                  <div className="space-y-4">

                    <p className="text-sm leading-6 text-slate-600">
                      Deactivating this funding program will hide it from customers on the public website.
                    </p>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

                      <div className="flex gap-3">

                        <svg
                          className="mt-0.5 shrink-0 text-amber-600"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                          />

                          <line
                            x1="12"
                            y1="8"
                            x2="12"
                            y2="12"
                          />

                          <line
                            x1="12"
                            y1="16"
                            x2="12.01"
                            y2="16"
                          />
                        </svg>

                        <p className="text-sm font-medium leading-6 text-amber-800">
                          Customers will no longer be able to see or apply for this program.
                        </p>

                      </div>

                    </div>

                    <p className="text-xs leading-5 text-slate-400">
                      Existing applications and funding data will remain preserved.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-4">

                    <p className="text-sm leading-6 text-slate-600">
                      Activating this funding program will make it visible to customers again.
                    </p>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

                      <div className="flex gap-3">

                        <svg
                          className="mt-0.5 shrink-0 text-emerald-600"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>

                        <p className="text-sm font-medium leading-6 text-emerald-800">
                          Customers will be able to view and apply for this program again.
                        </p>

                      </div>

                    </div>

                    <p className="text-xs leading-5 text-slate-400">
                      Existing applications and funding data will remain preserved.
                    </p>

                  </div>

                )}

                {/* Status error */}
                {statusError && (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">

                    <p className="text-sm font-semibold text-red-700">
                      {statusError}
                    </p>

                  </div>
                )}

              </div>

              {/* =================================================
                  STATUS MODAL FOOTER
              ================================================= */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={handleCloseStatusConfirmation}
                  disabled={
                    statusUpdatingId !== null
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={
                    statusUpdatingId !== null
                  }
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    statusConfirmingService.isActive
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >

                  {statusUpdatingId !== null
                    ? "Updating..."
                    : statusConfirmingService.isActive
                    ? "Deactivate Program"
                    : "Activate Program"}

                </button>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            DELETE CONFIRMATION MODAL
        ===================================================== */}

        {deletingService && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !deleting
              ) {
                handleCloseDelete();
              }
            }}
          >
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

              <div className="flex justify-center pt-7">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">

                  <svg
                    width="27"
                    height="27"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>

                </div>

              </div>

              <div className="px-7 pb-7 pt-5 text-center">

                <h2 className="text-xl font-bold text-slate-950">
                  Delete Funding Program?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This action cannot be undone. The selected funding
                  program will be permanently removed.
                </p>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">

                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Selected Program
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {deletingService.title ||
                      "Funding Program"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Funding ID #{deletingService.id}
                  </p>

                </div>

                {deleteError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left">

                    <p className="text-sm font-semibold text-red-700">
                      {deleteError}
                    </p>

                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={handleCloseDelete}
                    disabled={deleting}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {deleting && (
                      <svg
                        className="animate-spin"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="3"
                          opacity="0.3"
                        />

                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}

                    {deleting
                      ? "Deleting..."
                      : "Yes, Delete"}

                  </button>

                </div>

              </div>

            </div>
          </div>
        )}

      </main>
  );
}