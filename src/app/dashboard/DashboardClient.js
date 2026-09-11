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

  const [addData, setAddData] = useState({
    "Program ID": "",
    "Program Name": "",
    "Status": "",
    "Category": "",
    "Locations": "",
    "Jurisdiction": "",
    "Funding Agency": "",
    "Purpose": "",
    "Eligibility": "",
    "Eligibility Details": "",
    "Amount Min": "",
    "Amount Max": "",
    "Funding Type": "",
    "Amount Notes": "",
    "Documents Needed": "",
    "Contact Information": "",
    "Official Source URL": "",
    "Source Category": ""
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
  // LOGOUT STATE
  // =========================================================

  const [loggingOut, setLoggingOut] = useState(false);

  // =========================================================
  // SEARCH
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");

  // =========================================================
  // FETCH FUNDING SERVICES
  // =========================================================

  const fetchFundingServices = async () => {
    try {
      setLoadingServices(true);
      setUploadError("");

      const response = await fetch("/api/funding-services", {
        cache: "no-store",
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

    setAddData({
    "Program ID": "",
    "Program Name": "",
    "Status": "",
    "Category": "",
    "Locations": "",
    "Jurisdiction": "",
    "Funding Agency": "",
    "Purpose": "",
    "Eligibility": "",
    "Eligibility Details": "",
    "Amount Min": "",
    "Amount Max": "",
    "Funding Type": "",
    "Amount Notes": "",
    "Documents Needed": "",
    "Contact Information": "",
    "Official Source URL": "",
    "Source Category": ""
  });

    setAddMessage("");
    setAddError("");
  };

  const handleCloseAddModal = () => {
    if (addingData) {
      return;
    }

    setShowAddModal(false);

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
    const hasData = Object.values(addData).some(
      (value) => String(value ?? "").trim() !== ""
    );

    if (!hasData) {
      setAddError(
        "Please enter at least one funding detail before submitting."
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
            title: String(addData["Program Name"] || "").trim(),
            description:
              String(addData["Purpose"] || "").trim() || null,
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

      const result = await response.json();

      if (!response.ok) {
        setDeleteError(
          result.message ||
            "Failed to delete funding service."
        );

        return;
      }

      setDeletingService(null);

      await fetchFundingServices();
    } catch (error) {
      console.error(
        "Delete funding service error:",
        error
      );

      setDeleteError(
        "Something went wrong while deleting the funding service."
      );
    } finally {
      setDeleting(false);
    }
  };

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN";

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
                ? "Create, edit and delete"
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
                      Import from Excel or enter a funding opportunity manually.
                    </p>
                  </div>

                </div>

              </div>

              <div className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                EMPLOYEE DATA ENTRY
              </div>

            </div>

          </div>

          <div className="p-6 sm:p-7">

            <div className="grid gap-4 lg:grid-cols-2">

              {/* Excel */}
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

              {/* Manual entry */}
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="group relative flex min-h-[125px] items-center gap-4 rounded-2xl border-2 border-dashed border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-indigo-50/60 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:from-indigo-50 hover:to-cyan-50"
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

                <div>
                  <p className="font-semibold text-slate-900">
                    Add Data Manually
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Enter a new funding opportunity directly into the system.
                  </p>
                </div>

                <div className="ml-auto hidden rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm sm:block">
                  + ADD
                </div>

              </button>

            </div>

            {/* Upload button */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">

              <button
                type="button"
                onClick={handleExcelUpload}
                disabled={!selectedFile || uploading}
                className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
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
                Employees and Super Admins can add and edit funding data.
              </p>

            </div>

            {/* Upload success */}
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

            {/* Upload error */}
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

                    <th className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      ID
                    </th>

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

                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Created
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Updated
                    </th>

                    <th className="sticky right-0 z-20 border-l border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredServices.map(
                    (service) => (

                      <tr
                        key={service.id}
                        className="group transition hover:bg-indigo-50/30"
                      >

                        <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-5 py-4 group-hover:bg-indigo-50/30">

                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-bold text-slate-700">
                            #{service.id}
                          </span>

                        </td>

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
                                {formatValue(
                                  service.data?.[column]
                                )}
                              </div>

                            </td>

                          )
                        )}

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {service.createdAt
                            ? new Date(
                                service.createdAt
                              ).toLocaleString()
                            : "-"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {service.updatedAt
                            ? new Date(
                                service.updatedAt
                              ).toLocaleString()
                            : "-"}
                        </td>

                        <td className="sticky right-0 z-10 border-l border-slate-100 bg-white px-5 py-4 group-hover:bg-indigo-50/30">

                          <div className="flex items-center gap-2">

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  service
                                )
                              }
                              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-600"
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

                            {/* Delete */}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDelete(
                                    service
                                  )
                                }
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
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
                    Enter the funding information using the standard
                    fields from the funding database.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={addingData}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-xl text-white transition hover:bg-white/20 disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">

             
             

              {/* FUNDING FIELDS */}
              <div className="grid gap-5 md:grid-cols-2">

                {Object.entries(addData).map(
                  ([field, value], index) => {
                    const isLongField = [
                      "Purpose",
                      "Eligibility",
                      "Eligibility Details",
                      "Amount Notes",
                      "Documents Needed",
                      "Contact Information",
                    ].includes(field);

                    const isUrl = field === "Official Source URL";

                    return (
                      <div
                        key={field}
                        className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_3px_15px_rgba(15,23,42,0.04)] transition hover:border-teal-200 hover:shadow-[0_8px_25px_rgba(15,23,42,0.07)] ${
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
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>

                        {isLongField ? (
                          <textarea
                            value={value ?? ""}
                            onChange={(event) =>
                              handleAddFieldChange(
                                field,
                                event.target.value
                              )
                            }
                            rows={
                              field === "Eligibility Details"
                                ? 5
                                : 4
                            }
                            placeholder={`Enter ${field.toLowerCase()}`}
                            className="w-full resize-y rounded-xl border border-slate-200 bg-[#f8fafb] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                          />
                        ) : (
                          <input
                            type={isUrl ? "url" : "text"}
                            value={value ?? ""}
                            onChange={(event) =>
                              handleAddFieldChange(
                                field,
                                event.target.value
                              )
                            }
                            placeholder={`Enter ${field.toLowerCase()}`}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafb] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                          />
                        )}

                        {field === "Program ID" && (
                          <p className="mt-2 text-[11px] text-slate-400">
                            Optional. Leave blank if the system should
                            not receive a manually assigned program ID.
                          </p>
                        )}

                        {field === "Official Source URL" && (
                          <p className="mt-2 text-[11px] text-slate-400">
                            Add the official source webpage for this
                            funding opportunity.
                          </p>
                        )}
                      </div>
                    );
                  }
                )}

              </div>

              {/* ERROR */}
              {addError && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    !
                  </div>

                  <p className="pt-1 text-sm font-semibold text-red-700">
                    {addError}
                  </p>
                </div>
              )}

              {/* SUCCESS */}
              {addMessage && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    ✓
                  </div>

                  <p className="pt-1 text-sm font-semibold text-emerald-700">
                    {addMessage}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">

              <p className="text-xs leading-5 text-slate-400">
                At least one funding field must contain information.
              </p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={addingData}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveManualData}
                  disabled={addingData}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071a2d] px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingData ? (
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
                      Save Funding Data
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
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      {editingService && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseEdit();
            }
          }}
        >

          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Modal header */}
            <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-6 py-6 text-white sm:px-8">

              <div className="absolute -right-10 -top-20 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />

              <div className="relative flex items-center justify-between">

                <div>

                  <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                    Funding Program
                  </div>

                  <h2 className="text-2xl font-bold">
                    Edit Program
                  </h2>

                  <p className="mt-1 text-sm text-slate-300">
                    Funding ID #{editingService.id}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={savingEdit}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  ×
                </button>

              </div>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto px-6 py-7 sm:px-8">

              <div className="mb-8">

                <div className="mb-5">

                  <h3 className="text-lg font-bold text-slate-950">
                    Basic Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the main program information.
                  </p>

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Title
                    </label>

                    <input
                      type="text"
                      value={editTitle}
                      onChange={(event) =>
                        setEditTitle(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Description
                    </label>

                    <input
                      type="text"
                      value={editDescription}
                      onChange={(event) =>
                        setEditDescription(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />

                  </div>

                </div>
              </div>

              <div>

                <div className="mb-5">

                  <h3 className="text-lg font-bold text-slate-950">
                    Funding Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Edit the fields imported from your Excel file or manually added.
                  </p>

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  {Object.entries(
                    editData
                  ).map(
                    ([field, value]) => (

                      <div key={field}>

                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          {field}
                        </label>

                        <textarea
                          value={
                            value === null ||
                            value === undefined
                              ? ""
                              : typeof value ===
                                  "object"
                                ? JSON.stringify(
                                    value
                                  )
                                : String(value)
                          }
                          onChange={(event) =>
                            handleEditFieldChange(
                              field,
                              event.target.value
                            )
                          }
                          rows={3}
                          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                        />

                      </div>
                    )
                  )}

                </div>

              </div>

              {editMessage && (

                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">

                  <p className="text-sm font-semibold text-emerald-700">
                    ✓ {editMessage}
                  </p>

                </div>
              )}

              {editError && (

                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">

                  <p className="text-sm font-semibold text-red-700">
                    {editError}
                  </p>

                </div>
              )}

            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">

              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={savingEdit}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {savingEdit && (
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

                {savingEdit
                  ? "Saving..."
                  : "Save Changes"}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      {deletingService && (

        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
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
                This action cannot be undone. The selected funding program will be permanently removed.
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
                  Funding ID #
                  {deletingService.id}
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