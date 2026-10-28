"use client";

import { useEffect, useMemo, useState } from "react";


const APPLICANT_TYPE_OPTIONS = [
  "First Nation / Indigenous government or band, including tribal councils",
  "Inuit organization (NTI, Regional Inuit Associations, development corporations)",
  "Métis organization or council",
  "Community or municipal government (cities, towns, villages, hamlets, charter communities)",
  "Indigenous-owned business",
  "Small business / entrepreneur",
  "Non-profit / society / charity, including co-operatives",
  "Housing provider or developer",
  "School, college or post-secondary institution",
  "Individual / youth / student / senior",
  "Not sure",
  "Other",
];

const TERRITORY_OPTIONS = [
  "Canada-wide",
  "Northwest Territories",
  "Nunavut",
  "Yukon",
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
];

const COMMUNITY_OPTIONS = {
  "Northwest Territories": [
    "Aklavik", "Fort McPherson", "Inuvik", "Paulatuk", "Sachs Harbour",
    "Tsiigehtchic", "Tuktoyaktuk", "Ulukhaktok", "Colville Lake", "Délı̨nę",
    "Fort Good Hope", "Norman Wells", "Tulita", "Fort Liard", "Fort Simpson",
    "Jean Marie River", "Nahanni Butte", "Sambaa K'e", "Wrigley", "Behchokǫ̀",
    "Dettah", "Gamètì", "Łutselk'e", "Wekweètì", "Whatì", "Yellowknife",
    "Enterprise", "Fort Providence", "Fort Resolution", "Fort Smith", "Hay River",
    "Kakisa", "Kátł'odeeche",
  ],
  Nunavut: [
    "Iqaluit", "Arctic Bay", "Clyde River", "Grise Fiord", "Igloolik", "Kimmirut",
    "Kinngait", "Pangnirtung", "Pond Inlet", "Qikiqtarjuaq", "Resolute Bay",
    "Sanikiluaq", "Sanirajak", "Arviat", "Baker Lake", "Chesterfield Inlet",
    "Coral Harbour", "Naujaat", "Rankin Inlet", "Whale Cove", "Cambridge Bay",
    "Gjoa Haven", "Kugaaruk", "Kugluktuk", "Taloyoak",
  ],
};

const FUNDING_CATEGORIES = [
  { name: "Business Development", children: [] },
  { name: "Community Development", children: [] },
  { name: "Capacity Building", children: [] },
  { name: "Education & Training", children: [] },
  { name: "Financial & Income Assistance", children: ["Financial Assistance", "Income Assistance"] },
  { name: "Environment & Energy", children: [] },
  { name: "Housing", children: [] },
  { name: "Arts & Culture", children: [] },
  { name: "Infrastructure & Transportation", children: ["Infrastructure", "Transportation"] },
  { name: "Health & Wellness", children: [] },
  { name: "Research & Innovation", children: [] },
  { name: "Agriculture & Food", children: [] },
  { name: "Jobs & Employment", children: [] },
  { name: "Gender Equity, Justice & Victim Support", children: ["Gender & Equity", "Justice & Victim Support"] },
  { name: "Land, Natural Resources & Harvesting", children: ["Natural Resources", "Hunting & Trapping"] },
  { name: "Emergencies & Public Safety", children: [] },
  { name: "Early Learning & Childcare", children: [] },
  { name: "Sports & Recreation", children: [] },
  { name: "Other", children: [] },
];

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
  // =========================================================
// VIEW STATE
// =========================================================

const [viewingService, setViewingService] = useState(null);

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

  const [selectedApplicantTypes, setSelectedApplicantTypes] = useState([]);
  const [otherApplicantType, setOtherApplicantType] = useState("");
  const [selectedTerritory, setSelectedTerritory] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [otherCommunity, setOtherCommunity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [otherCategory, setOtherCategory] = useState("");

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
  // PROGRAM STATUS COUNTS
  // Counts active programs by application status. Display-only;
  // no database changes are made.
  // =========================================================

  const getProgramStatus = (service) => {
    const statusEntry = Object.entries(service?.data || {}).find(
      ([key]) => {
        const normalizedKey = String(key).trim().toLowerCase();
        return normalizedKey === "status" || normalizedKey === "program status";
      }
    );

    return String(statusEntry?.[1] ?? service?.status ?? "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ");
  };

  const openNowServicesCount = useMemo(
    () => fundingServices.filter((service) => {
      if (service?.isActive === false) return false;

      const status = getProgramStatus(service).replace(/\s+/g, " ").trim();

      // Count only the approved customer-visible statuses.
      // Closed, discontinued, blank, and unrecognized statuses are excluded.
      return (
        status === "open" ||
        status === "open (rolling)" ||
        status === "open rolling" ||
        status === "upcoming" ||
        status === "opens soon" ||
        status === "opening soon" ||
        status === "no application required" ||
        status === "application not required" ||
        status === "no application needed" ||
        status === "application not needed" ||
        status === "not required"
      );
    }).length,
    [fundingServices]
  );

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
  // DOWNLOAD FILTERED OR ALL FUNDING SERVICES AS CSV
  // =========================================================

  const handleDownloadCSV = () => {
    // Export all matching records, not just the current page.
    const servicesToExport = filteredServices;

    if (servicesToExport.length === 0) {
      alert("There are no funding records to export.");
      return;
    }

    const headers = [
      "ID",
      "Funding Service Title",
      ...dynamicColumns,
      "Status",
      "Created",
      "Updated",
    ];

    const escapeCSV = (value) => {
      if (value === null || value === undefined) {
        return '""';
      }

      let text = typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

      // Reduce the risk of spreadsheet formula execution for untrusted values.
      if (/^[\s]*[=+@]/.test(text) || /^[\s]*-/.test(text)) {
        text = "'" + text;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = servicesToExport.map((service) => {
      const data = service.data || {};

      return [
        service.id,
        service.title,
        ...dynamicColumns.map((column) => data[column]),
        service.isActive === false ? "Inactive" : "Active",
        service.createdAt
          ? new Date(service.createdAt).toISOString()
          : "",
        service.updatedAt
          ? new Date(service.updatedAt).toISOString()
          : "",
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    // UTF-8 BOM helps Excel recognize accents and other special characters.
    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `funding-services-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Do not revoke the Blob URL immediately: some browsers cancel the
    // download if the URL is removed before the download has started.
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // =========================================================
  // FORMAT VALUES
  // =========================================================



const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);

const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;

const paginatedServices = filteredServices.slice(
  startIndex,
  startIndex + itemsPerPage
);

const startItem = filteredServices.length === 0 ? 0 : startIndex + 1;
const endItem = Math.min(
  startIndex + itemsPerPage,
  filteredServices.length
);

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, itemsPerPage]);


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

  // Format funding amounts with Canadian/Western digit grouping.
  // Example: $10,00,000 -> $1,000,000. This only changes display text.
  const formatCanadianAmount = (value) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (typeof value === "number") {
      return new Intl.NumberFormat("en-CA", {
        useGrouping: true,
        maximumFractionDigits: 20,
      }).format(value);
    }

    if (typeof value !== "string") {
      return formatValue(value);
    }

    return value.replace(/\d[\d,]*(?:\.\d+)?/g, (numberText) => {
      const numericValue = Number(numberText.replace(/,/g, ""));

      if (!Number.isFinite(numericValue)) {
        return numberText;
      }

      return new Intl.NumberFormat("en-CA", {
        useGrouping: true,
        maximumFractionDigits: 20,
      }).format(numericValue);
    });
  };

  const isAmountField = (field) =>
    /amount|funding amount|maximum amount|minimum amount|max amount|min amount/i.test(
      String(field || "")
    );

  // =========================================================
  // MANUAL ADD
  // =========================================================

  const handleOpenAddModal = () => {
    setShowAddModal(true);

    setAddTitle("");
    setAddDescription("");
    setSelectedApplicantTypes([]);
    setOtherApplicantType("");
    setSelectedTerritory("");
    setSelectedCommunity("");
    setOtherCommunity("");
    setSelectedCategories([]);
    setOtherCategory("");

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
      "Applicant Types": "",
      Communities: "",
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
    setSelectedApplicantTypes([]);
    setOtherApplicantType("");
    setSelectedTerritory("");
    setSelectedCommunity("");
    setOtherCommunity("");
    setSelectedCategories([]);
    setOtherCategory("");
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
      setAddError("Program Name is required.");
      return;
    }

    // "Other" is a selectable option on its own; no specification is required.
    const applicantTypesToSave = [...selectedApplicantTypes];
    const categoriesToSave = [...selectedCategories];
    const communityToSave = selectedTerritory === "Northwest Territories" || selectedTerritory === "Nunavut"
      ? selectedCommunity
      : otherCommunity.trim();

    if (!applicantTypesToSave.length) {
      setAddError("Select at least one applicant type, or choose Not sure.");
      return;
    }
    if (!selectedTerritory) {
      setAddError("Territory/Province is required.");
      return;
    }
    if (!categoriesToSave.length) {
      setAddError("Select at least one category.");
      return;
    }
    if ((selectedTerritory === "Northwest Territories" || selectedTerritory === "Nunavut") && !selectedCommunity) {
      setAddError("Community is required for Northwest Territories and Nunavut. Choose All communities / territory-wide if applicable.");
      return;
    }
    if (selectedTerritory !== "Canada-wide" && selectedTerritory !== "Northwest Territories" && selectedTerritory !== "Nunavut" && !communityToSave) {
      setAddError("Enter a community or type All communities / territory-wide.");
      return;
    }
    const payloadData = {
      ...addData,
      "Applicant Types": applicantTypesToSave.join(", "),
      Locations: selectedTerritory,
      Communities: communityToSave || "",
      Category: categoriesToSave.join(", "),
    };

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
            data: payloadData,
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
// VIEW
// =========================================================

const handleView = (service) => {
  setViewingService(service);
};

const handleCloseView = () => {
  setViewingService(null);
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
    setEditError("Funding service title is required.");
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
          description: editDescription.trim() || null,
          data: editData,
        }),
      }
    );

    // Read the response as text first to avoid JSON parsing errors.
    const responseText = await response.text();

    let result = {};

    if (responseText.trim()) {
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "Invalid funding service API response:",
          responseText,
          parseError
        );

        throw new Error(
          `The server returned an invalid response (HTTP ${response.status}). Check your API route and server logs.`
        );
      }
    }

    // Handle HTTP errors and API-level errors.
    if (!response.ok || result.success === false) {
      throw new Error(
        result.message ||
          `Failed to update funding service (HTTP ${response.status}).`
      );
    }

    // A successful response should confirm the update.
    if (result.success !== true) {
      throw new Error(
        "The server did not confirm that the funding service was updated."
      );
    }

    // Show success message.
    setEditMessage(
      result.message ||
        "Funding service updated successfully."
    );

    // Refresh the funding services list.
    await fetchFundingServices();

    // Close the edit modal after a short delay.
    setTimeout(() => {
      handleCloseEdit();
    }, 500);
  } catch (error) {
    console.error(
      "Update funding service error:",
      error
    );

    setEditError(
      error?.message ||
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

  const renderValue = (value, field) => {
    const formattedValue = isAmountField(field)
      ? formatCanadianAmount(value)
      : formatValue(value);

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
        className="inline-flex max-w-full items-center gap-1.5 truncate font-semibold text-teal-600 underline decoration-teal-300 underline-offset-2 transition hover:text-teal-800 hover:decoration-teal-500"
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

// =========================================================
// CLOSE ALL FUNDING MODALS
// =========================================================

const closeAllFundingModals = () => {
  // View modal
  setViewingService(null);

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
    <main className="min-h-screen bg-[#f1f6f8] text-slate-900">

      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-200/25 blur-3xl" />

        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cyan-200/15 blur-3xl" />
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

  
{/* =====================================================
    DARK THEMED HEADER
===================================================== */}

<header className="sticky top-0 z-40 border-b border-teal-400/15 bg-[#071a2d]/95 shadow-lg shadow-slate-950/10 backdrop-blur-xl">
 <div className="bg-[#0B2438]">
  <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-2 lg:px-8">

    {/* Brand */}
   {/* Brand */}
<div className="flex min-w-0 items-center gap-4 sm:gap-5">

  {/* Logo — IBS Group Canada website */}
  <a
    href="https://ibsgroupcanada.com"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Visit IBS Group Canada website"
    className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white shadow-lg shadow-[#071a2d]/30 transition-opacity hover:opacity-85 sm:h-16 sm:w-16"
  >
    <img
      src="/logo.jpg"
      alt="IBS Logo"
      className="h-full w-full object-cover"
    />
  </a>

  {/* Brand Name — Funding homepage */}
  <a
    href="/"
    aria-label="Go to Funding Program Portal homepage"
    className="group min-w-0"
  >
    <h1 className="truncate text-base font-black tracking-tight text-white transition-colors duration-300 group-hover:text-[#7DD3FC] sm:text-xl">
      Innovative Business Solutions Ltd.
    </h1>
      <span className="text-xs font-medium leading-relaxed tracking-[0.01em] text-slate-400 sm:text-sm">
    Funding found. Applications supported by IBS.
  </span>

 
  </a>

</div>

    {/* User area */}
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">

      {/* Role badge */}
      <div
        className={`rounded-lg border px-2 py-2 text-[9px] font-extrabold tracking-wider sm:rounded-xl sm:px-3 sm:text-xs ${
          isSuperAdmin
            ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
            : "border-[#7DD3FC]/20 bg-[#7DD3FC]/10 text-[#7DD3FC]"
        }`}
      >
        {isSuperAdmin ? "SUPER ADMIN" : "EMPLOYEE"}
      </div>

      {/* Signed-in user */}
      <div className="hidden rounded-xl border border-[#7DD3FC]/20 bg-[#12334D] px-4 py-2.5 shadow-md sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7DD3FC]">
          Signed in as
        </p>

        <p className="mt-0.5 max-w-[220px] truncate text-sm font-semibold text-white">
          {user?.email}
        </p>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200 shadow-sm transition duration-300 hover:border-[#7DD3FC]/40 hover:bg-[#2374A8]/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>

        <span className="hidden sm:inline">
          {loggingOut ? "Logging out..." : "Logout"}
        </span>
      </button>

    </div>
  </div>
</div>
</header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8 lg:py-10">

        {/* Hero */}
        <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#061525] via-[#062b35] to-[#0b2448] p-6 shadow-2xl shadow-slate-200 sm:p-8 lg:p-10">

          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />

          <div className="absolute -bottom-28 right-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

             <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize:
              "44px 44px",
          }}
        />

          <div className="relative z-10 max-w-3xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              Administration Portal
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Manage your funding
              <span className="block bg-gradient-to-r from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent">
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

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
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
              <div className="h-full w-3/4 rounded-full bg-teal-500 transition-all group-hover:w-full" />
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

          {/* Open now services */}
          <div className="group rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/70">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Open Now Services</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{openNowServicesCount}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 2.5 2.5L16 9" />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">Open now, upcoming, and no-application-required programs</p>
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

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
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
      // className={
      //   isSuperAdmin
      //     ? "grid gap-4 lg:grid-cols-2"
      //     : "grid gap-4"
      // }
      className="grid gap-4 lg:grid-cols-2"
    >

      {/* =================================================
          EXCEL UPLOAD
          SUPER ADMIN ONLY
      ================================================= */}

      {/* {isSuperAdmin && ( */}
        <label
          htmlFor="excel-upload"
          className={`group relative flex min-h-[125px] cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-5 transition ${
            selectedFile
              ? "border-teal-300 bg-teal-50/50"
              : "border-slate-200 bg-slate-50/70 hover:border-teal-300 hover:bg-teal-50/40"
          }`}
        >

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
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
      {/* // )} */}

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
          to-teal-50/60
          p-5
          text-left
          transition
          hover:-translate-y-0.5
          hover:border-teal-300
          hover:from-teal-50
          hover:to-cyan-50
        "
      >

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm transition group-hover:scale-105">

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

        <div className="ml-auto hidden rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-teal-600 shadow-sm sm:block">
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
            from-[#071a2d]
            to-[#087e8b]
            px-7
            text-sm
            font-bold
            text-white
            shadow-lg
            shadow-teal-200
            transition
            hover:-translate-y-0.5
            hover:from-[#0b2438]
            hover:to-[#0f9a9a]
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
  {/* Table header */}
  <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2438] text-white">
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#0B2438]">
            Funding Services
          </h3>
          <p className="mt-0.5 text-sm text-[#43515C]">
            {filteredServices.length} of {fundingServices.length} opportunities
          </p>
        </div>
      </div>

      {/* Search and CSV Download */}
      <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
        {/* Search */}
        <div className="relative w-full sm:min-w-[260px] lg:max-w-sm">
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
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search funding programs..."
            className="w-full rounded-xl border border-slate-200 bg-[#EEF5F8]/60 py-3 pl-11 pr-4 text-sm text-[#0B2438] outline-none transition placeholder:text-slate-400 focus:border-[#2374A8] focus:bg-white focus:ring-4 focus:ring-[#2374A8]/10"
          />
        </div>

        {/* Download every filtered result, across all pages */}
        <button
          type="button"
          onClick={handleDownloadCSV}
          disabled={loadingServices || filteredServices.length === 0}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B2438] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2374A8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          Download CSV
          <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-xs">
            {filteredServices.length}
          </span>
        </button>
      </div>
    </div>
  </div>

  {/* Loading state */}
  {loadingServices ? (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5F8]">
        <svg
          className="animate-spin text-[#2374A8]"
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
      <p className="mt-4 text-sm font-semibold text-[#43515C]">
        Loading funding services...
      </p>
      <p className="mt-1 text-xs text-slate-400">Please wait a moment</p>
    </div>
  ) : fundingServices.length === 0 ? (
    /* No services */
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF5F8] text-[#2374A8]">
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
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      </div>
      <h4 className="mt-5 font-bold text-[#0B2438]">
        No funding programs yet
      </h4>
      <p className="mt-1 max-w-sm text-sm text-[#43515C]">
        Upload an Excel file or use Add Data Manually above to create your first
        funding opportunity.
      </p>
    </div>
  ) : filteredServices.length === 0 ? (
    /* No search matches */
    <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-slate-400"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
      <p className="mt-4 font-semibold text-[#0B2438]">
        No matching programs
      </p>
      <p className="mt-1 text-sm text-[#43515C]">
        Try a different search term.
      </p>
    </div>
  ) : (
    <>
      {/* Responsive table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#EEF5F8]/70">
              <th className="sticky left-0 z-20 border-r border-slate-200 bg-[#EEF5F8] px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#43515C]">
                ID
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#43515C]">
                Funding Service Title
              </th>

              {dynamicColumns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#43515C]"
                >
                  {column}
                </th>
              ))}

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#43515C]">
                Status
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#43515C]">
                Created
              </th>

              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#43515C]">
                Updated
              </th>

              <th className="sticky right-0 z-20 border-l border-slate-200 bg-[#EEF5F8] px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#43515C]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/80">
            {paginatedServices.map((service, index) => (
              <tr
                key={service.id}
                className={`group transition ${
                  index % 2 === 0
                    ? "bg-white hover:bg-[#EEF5F8]/70"
                    : "bg-slate-50/70 hover:bg-[#EEF5F8]"
                }`}
              >
                {/* ID */}
                <td
                  className={`sticky left-0 z-10 border-r border-slate-200 px-5 py-4 ${
                    index % 2 === 0
                      ? "bg-white group-hover:bg-[#EEF5F8]/70"
                      : "bg-slate-50/70 group-hover:bg-[#EEF5F8]"
                  }`}
                >
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#EEF5F8] px-2 text-xs font-bold text-[#0B2438]">
                    #{service.id}
                  </span>
                </td>

                {/* Title */}
                <td className="px-5 py-4 text-sm font-semibold text-[#0B2438]">
                  {service.title || "-"}
                </td>

                {/* Dynamic columns */}
                {dynamicColumns.map((column) => (
                  <td
                    key={`${service.id}-${column}`}
                    className="max-w-[320px] whitespace-nowrap px-5 py-4 text-[#43515C]"
                    title={
                      isAmountField(column)
                        ? formatCanadianAmount(service.data?.[column])
                        : formatValue(service.data?.[column])
                    }
                  >
                    <div className="max-w-[320px] truncate">
                      {renderValue(service.data?.[column], column)}
                    </div>
                  </td>
                ))}

                {/* Status */}
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
                        service.isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {service.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                {/* Created */}
                <td className="whitespace-nowrap px-5 py-4 text-xs text-[#43515C]">
                  {service.createdAt
                    ? new Date(service.createdAt).toLocaleString()
                    : "-"}
                </td>

                {/* Updated */}
                <td className="whitespace-nowrap px-5 py-4 text-xs text-[#43515C]">
                  {service.updatedAt
                    ? new Date(service.updatedAt).toLocaleString()
                    : "-"}
                </td>

                {/* Actions */}
              
<td
  className="
    sticky right-0 
    border-l border-slate-200
    bg-white
    px-5 py-4
  "
  style={{
    backgroundColor: "#ffffff",
   
  }}
>
  <div className="flex items-center gap-2">
    {/* View */}
    <button
      type="button"
      onClick={() => handleView(service)}
      className="
        inline-flex items-center gap-1.5
        rounded-lg
        border border-[#2374A8]/20
        bg-[#2374A8]/5
        px-3.5 py-2
        text-xs font-bold text-[#2374A8]
        shadow-sm transition
        hover:border-[#2374A8]
        hover:bg-[#2374A8]
        hover:text-white
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
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      View
    </button>

    {/* Edit */}
    <button
      type="button"
      onClick={() => handleEdit(service)}
      className="
        inline-flex items-center gap-1.5
        rounded-lg
        bg-[#0B2438]
        px-3.5 py-2
        text-xs font-bold text-white
        shadow-sm transition
        hover:bg-[#2374A8]
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-[#43515C]">
          Showing{" "}
          <span className="font-bold text-[#0B2438]">{startItem}</span>
          {" "}to{" "}
          <span className="font-bold text-[#0B2438]">{endItem}</span>
          {" "}of{" "}
          <span className="font-bold text-[#0B2438]">
            {filteredServices.length}
          </span>{" "}
          results
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {/* Page size */}
          <select
            value={itemsPerPage}
            onChange={(event) => setItemsPerPage(Number(event.target.value))}
            aria-label="Items per page"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#0B2438] outline-none focus:border-[#2374A8] focus:ring-2 focus:ring-[#2374A8]/10"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          {/* Previous */}
          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
            }
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#0B2438] transition hover:border-[#2374A8] hover:bg-[#EEF5F8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page numbers with ellipses */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
              )
              .reduce((pages, page, index, visiblePages) => {
                if (
                  index > 0 &&
                  page - visiblePages[index - 1] > 1
                ) {
                  pages.push(`ellipsis-${page}`);
                }

                pages.push(page);
                return pages;
              }, [])
              .map((page) =>
                typeof page === "string" ? (
                  <span
                    key={page}
                    className="px-1 text-sm text-slate-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-lg px-2 text-sm font-bold transition ${
                      currentPage === page
                        ? "bg-[#0B2438] text-white shadow-sm"
                        : "text-[#43515C] hover:bg-[#EEF5F8] hover:text-[#2374A8]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#0B2438] transition hover:border-[#2374A8] hover:bg-[#EEF5F8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Next</span> →
          </button>
        </div>
      </div>
    </>
  )}
</div>


     


      </section>


 
      <footer className="bg-[#071a2d]">

     <div className="mx-auto max-w-[1800px] px-5 py-4 text-center sm:px-6 lg:px-10 xl:px-12">
  <div className="pb-3 pt-3 text-xs text-slate-500">
    © Copyright 2026 Innovative Business Solutions | All Rights Reserved
  </div>
</div>

      </footer>

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

                {/* Applicant, territory, community and category */}
                <section className="mb-8 rounded-2xl border border-teal-100 bg-teal-50/30 p-5 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-base font-bold text-slate-950">Program Classification</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Complete the required classification fields. Use “Other” when the listed options do not fit.
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-600">
                      2.1 Who you are (applicant type) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {APPLICANT_TYPE_OPTIONS.map((option) => (
                        <label key={option} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm transition ${
                          selectedApplicantTypes.includes(option)
                            ? "border-teal-400 bg-teal-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedApplicantTypes.includes(option)}
                            onChange={(event) => {
                              let next = event.target.checked
                                ? [...selectedApplicantTypes, option]
                                : selectedApplicantTypes.filter((item) => item !== option);
                              if (option === "Not sure" && event.target.checked) {
                                next = ["Not sure"];
                              } else if (option !== "Not sure" && event.target.checked) {
                                next = next.filter((item) => item !== "Not sure");
                              }
                              setSelectedApplicantTypes(next);
                              handleAddFieldChange("Applicant Types", next.join(", "));
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-600"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Select one or more. “Not sure” clears other selections and shows all applicant types.</p>
                  </div>

                  <div className="mb-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                        2.2 Territory/Province <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedTerritory}
                        onChange={(event) => {
                          const territory = event.target.value;
                          setSelectedTerritory(territory);
                          setSelectedCommunity("");
                          setOtherCommunity("");
                          handleAddFieldChange("Locations", territory);
                          handleAddFieldChange("Communities", "");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                      >
                        <option value="">Select territory/province *</option>
                        {TERRITORY_OPTIONS.map((territory) => <option key={territory} value={territory}>{territory}</option>)}
                      </select>
                      <p className="mt-2 text-xs text-slate-500">Canada-wide is for national programs only. Other territories include their local and Canada-wide programs when filtering.</p>
                    </div>

                    {selectedTerritory && selectedTerritory !== "Canada-wide" && (
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                          2.3 Community <span className="text-red-500">*</span>
                        </label>
                        {(selectedTerritory === "Northwest Territories" || selectedTerritory === "Nunavut") ? (
                          <select
                            value={selectedCommunity}
                            onChange={(event) => {
                              setSelectedCommunity(event.target.value);
                              handleAddFieldChange("Communities", event.target.value);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                          >
                            <option value="">Select community *</option>
                            <option value="All communities / territory-wide">All communities / territory-wide</option>
                            {(COMMUNITY_OPTIONS[selectedTerritory] || []).map((community) => (
                              <option key={community} value={community}>{community}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={otherCommunity}
                            onChange={(event) => {
                              setOtherCommunity(event.target.value);
                              handleAddFieldChange("Communities", event.target.value);
                            }}
                            placeholder="Enter community or All communities / territory-wide *"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                          />
                        )}
                        <p className="mt-2 text-xs text-slate-500">Choose a listed community for NWT/Nunavut. For other provinces and territories, enter the community name or “All communities / territory-wide”.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-600">
                      2.4 Category <span className="text-red-500">*</span>
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {FUNDING_CATEGORIES.map((category) => (
                        <div key={category.name} className="rounded-xl border border-slate-200 bg-white p-3">
                          <label className="flex cursor-pointer items-start gap-2 text-sm font-semibold text-slate-800">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.name)}
                              onChange={(event) => {
                                const next = event.target.checked
                                  ? [...selectedCategories, category.name]
                                  : selectedCategories.filter((item) => item !== category.name);
                                setSelectedCategories(next);
                                handleAddFieldChange("Category", next.join(", "));
                              }}
                              className="mt-0.5 h-4 w-4 accent-teal-600"
                            />
                            <span>{category.name}</span>
                          </label>
                          {category.children.length > 0 && (
                            <div className="ml-6 mt-3 space-y-2 border-l-2 border-slate-100 pl-3">
                              {category.children.map((child) => (
                                <label key={child} className="flex cursor-pointer items-start gap-2 text-sm text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(child)}
                                    onChange={(event) => {
                                      const next = event.target.checked
                                        ? [...selectedCategories, child]
                                        : selectedCategories.filter((item) => item !== child);
                                      setSelectedCategories(next);
                                      handleAddFieldChange("Category", next.join(", "));
                                    }}
                                    className="mt-0.5 h-4 w-4 accent-teal-600"
                                  />
                                  <span>{child}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes("Other")}
                          onChange={(event) => {
                            const option = "Other";
                            const next = event.target.checked
                              ? [...selectedCategories, option]
                              : selectedCategories.filter((item) => item !== option);
                            setSelectedCategories(next);
                            handleAddFieldChange("Category", next.join(", "));
                          }}
                          className="mt-0.5 h-4 w-4 accent-teal-600"
                        />
                        <span>Other</span>
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Select one or more categories. Subcategories are indented under their parent categories.</p>
                  </div>
                </section>

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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-xs font-bold text-teal-600 shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-200 transition hover:-translate-y-0.5 hover:from-teal-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
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

              <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 px-6 py-6 text-white sm:px-8">

                <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />

                <div className="absolute bottom-[-100px] left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

                <div className="relative flex items-center justify-between gap-4">

                  <div>

                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-200">

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
                        className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafb] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
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
                        className="w-full resize-y rounded-xl border border-slate-200 bg-[#f8fafb] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                      />

                    </div>

                  </div>

                </div>

                {/* =================================================
                    PROGRAM CLASSIFICATION
                ================================================= */}

                <section className="mb-8 rounded-2xl border border-teal-100 bg-teal-50/30 p-5 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-base font-bold text-slate-950">Program Classification</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Update applicant type, location, community, and program category.
                    </p>
                  </div>

                  {/* 2.1 Applicant type */}
                  <div className="mb-6">
                    <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-600">
                      2.1 Who you are (applicant type)
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {APPLICANT_TYPE_OPTIONS.map((option) => {
                        const current = String(editData["Applicant Types"] ?? "");
                        const checked = current.includes(option);
                        return (
                          <label key={option} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm transition ${checked ? "border-teal-400 bg-teal-50 text-slate-900" : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                const selected = APPLICANT_TYPE_OPTIONS.filter((item) => {
                                  if (item === option) return event.target.checked;
                                  return String(editData["Applicant Types"] ?? "").includes(item);
                                });
                                let next = selected;
                                if (option === "Not sure" && event.target.checked) next = ["Not sure"];
                                else if (option !== "Not sure" && event.target.checked) next = selected.filter((item) => item !== "Not sure");
                                handleEditFieldChange("Applicant Types", next.join(", "));
                              }}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-600"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Select one or more. “Not sure” clears other selections. “Other” is saved as an option without an extra text field.</p>
                  </div>

                  {/* 2.2 Territory / province and 2.3 community */}
                  <div className="mb-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">2.2 Territory/Province</label>
                      <select
                        value={String(editData.Locations ?? "")}
                        onChange={(event) => {
                          handleEditFieldChange("Locations", event.target.value);
                          handleEditFieldChange("Communities", "");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                      >
                        <option value="">Select territory/province</option>
                        {TERRITORY_OPTIONS.map((territory) => <option key={territory} value={territory}>{territory}</option>)}
                      </select>
                      <p className="mt-2 text-xs text-slate-500">Canada-wide is for national programs. Other territories include local and Canada-wide programs when filtering.</p>
                    </div>
                    {String(editData.Locations ?? "") && String(editData.Locations ?? "") !== "Canada-wide" && (
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">2.3 Community</label>
                        {(String(editData.Locations) === "Northwest Territories" || String(editData.Locations) === "Nunavut") ? (
                          <select
                            value={String(editData.Communities ?? "")}
                            onChange={(event) => handleEditFieldChange("Communities", event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                          >
                            <option value="">Select community</option>
                            <option value="All communities / territory-wide">All communities / territory-wide</option>
                            {(COMMUNITY_OPTIONS[String(editData.Locations)] || []).map((community) => <option key={community} value={community}>{community}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={String(editData.Communities ?? "")}
                            onChange={(event) => handleEditFieldChange("Communities", event.target.value)}
                            placeholder="Enter community or All communities / territory-wide"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                          />
                        )}
                        <p className="mt-2 text-xs text-slate-500">Choose a listed community for NWT/Nunavut, or enter a community for other provinces and territories.</p>
                      </div>
                    )}
                  </div>

                  {/* 2.4 Category */}
                  <div>
                    <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-600">2.4 Category</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {FUNDING_CATEGORIES.map((category) => {
                        const current = String(editData.Category ?? "");
                        const checked = current.includes(category.name);
                        return (
                          <div key={category.name} className="rounded-xl border border-slate-200 bg-white p-3">
                            <label className="flex cursor-pointer items-start gap-2 text-sm font-semibold text-slate-800">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  const options = [...FUNDING_CATEGORIES.map((item) => item.name), ...FUNDING_CATEGORIES.flatMap((item) => item.children), "Other"];
                                  const selected = options.filter((item) => {
                                    if (item === category.name) return event.target.checked;
                                    return String(editData.Category ?? "").includes(item);
                                  });
                                  handleEditFieldChange("Category", [...new Set(selected)].join(", "));
                                }}
                                className="mt-0.5 h-4 w-4 accent-teal-600"
                              />
                              <span>{category.name}</span>
                            </label>
                            {category.children.length > 0 && (
                              <div className="ml-6 mt-3 space-y-2 border-l-2 border-slate-100 pl-3">
                                {category.children.map((child) => {
                                  const childChecked = String(editData.Category ?? "").includes(child);
                                  return (
                                    <label key={child} className="flex cursor-pointer items-start gap-2 text-sm text-slate-600">
                                      <input
                                        type="checkbox"
                                        checked={childChecked}
                                        onChange={(event) => {
                                          const options = [...FUNDING_CATEGORIES.map((item) => item.name), ...FUNDING_CATEGORIES.flatMap((item) => item.children), "Other"];
                                          const selected = options.filter((item) => {
                                            if (item === child) return event.target.checked;
                                            return String(editData.Category ?? "").includes(item);
                                          });
                                          handleEditFieldChange("Category", [...new Set(selected)].join(", "));
                                        }}
                                        className="mt-0.5 h-4 w-4 accent-teal-600"
                                      />
                                      <span>{child}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Select one or more categories. Subcategories are indented under their parent categories. “Other” does not require a specification.</p>
                  </div>
                </section>

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

                  {Object.entries(editData).filter(([field]) => !["Applicant Types", "Locations", "Communities", "Category"].includes(field.trim())).length === 0 ? (

                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">

                      <p className="text-sm font-semibold text-slate-600">
                        No additional funding fields available.
                      </p>

                    </div>

                  ) : (

                    <div className="grid gap-5 md:grid-cols-2">

                      {Object.entries(editData).filter(([field]) => !["Applicant Types", "Locations", "Communities", "Category"].includes(field.trim())).map(
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

                          const rawEditValue = String(value ?? "");
                          const editSelectableOptions = [
                            ...APPLICANT_TYPE_OPTIONS,
                            ...FUNDING_CATEGORIES.flatMap((category) => [
                              category.name,
                              ...category.children,
                            ]),
                          ];
                          const selectedEditValues = editSelectableOptions.filter((option) =>
                            rawEditValue.includes(option)
                          );

                          const isApplicantTypesField =
                            field.trim().toLowerCase() === "applicant types";

                          const isCategoryField =
                            field.trim().toLowerCase() === "category";

                          const updateEditMultiSelect = (option, checked) => {
                            let next = checked
                              ? [...selectedEditValues, option]
                              : selectedEditValues.filter((item) => item !== option);

                            if (isApplicantTypesField) {
                              if (option === "Not sure" && checked) {
                                next = ["Not sure"];
                              } else if (option !== "Not sure" && checked) {
                                next = next.filter((item) => item !== "Not sure");
                              }
                            }

                            handleEditFieldChange(field, next.join(", "));
                          };

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
                                  FIELD
                                </span>

                              </div>

                              {isApplicantTypesField ? (

                                <div className="grid gap-2 sm:grid-cols-2">
                                  {APPLICANT_TYPE_OPTIONS.map((option) => (
                                    <label
                                      key={option}
                                      className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm transition ${
                                        selectedEditValues.includes(option)
                                          ? "border-teal-400 bg-teal-50 text-slate-900"
                                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedEditValues.includes(option)}
                                        onChange={(event) =>
                                          updateEditMultiSelect(option, event.target.checked)
                                        }
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-600"
                                      />
                                      <span>{option}</span>
                                    </label>
                                  ))}
                                </div>

                              ) : isCategoryField ? (

                                <div className="grid gap-2 sm:grid-cols-2">
                                  {FUNDING_CATEGORIES.map((category) => (
                                    <div key={category.name} className="space-y-2">
                                      <label
                                        className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm transition ${
                                          selectedEditValues.includes(category.name)
                                            ? "border-teal-400 bg-teal-50 text-slate-900"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedEditValues.includes(category.name)}
                                          onChange={(event) =>
                                            updateEditMultiSelect(category.name, event.target.checked)
                                          }
                                          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-600"
                                        />
                                        <span>{category.name}</span>
                                      </label>
                                      {category.children.length > 0 && (
                                        <div className="ml-6 space-y-2 border-l-2 border-teal-100 pl-3">
                                          {category.children.map((child) => (
                                            <label
                                              key={child}
                                              className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 text-sm transition ${
                                                selectedEditValues.includes(child)
                                                  ? "border-teal-400 bg-teal-50 text-slate-900"
                                                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={selectedEditValues.includes(child)}
                                                onChange={(event) =>
                                                  updateEditMultiSelect(child, event.target.checked)
                                                }
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-600"
                                              />
                                              <span>{child}</span>
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                              ) : isLongField ? (

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
                                  className="w-full resize-y rounded-xl border border-slate-200 bg-[#f8fafb] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
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
                                  className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafb] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
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
                                    className="inline-flex max-w-full items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-600 transition hover:bg-teal-100 hover:text-teal-800"
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
          hover:bg-teal-600
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

        {/* =====================================================
    VIEW FUNDING PROGRAM MODAL
===================================================== */}

{viewingService && (
  <div
    className="
      fixed
      inset-0
      z-[150]
      flex
      items-center
      justify-center
      bg-slate-950/70
      p-4
      backdrop-blur-sm
    "
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        handleCloseView();
      }
    }}
  >
    <div
      className="
        flex
        max-h-[92vh]
        w-full
        max-w-5xl
        flex-col
        overflow-hidden
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-[0_30px_100px_rgba(15,23,42,0.3)]
      "
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#071a2d] via-teal-950 to-slate-950 px-6 py-6 text-white sm:px-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />

        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Funding Program
            </div>

            <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {viewingService.title || "Funding Program"}
            </h2>

            {viewingService.description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                {viewingService.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCloseView}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/10
              text-slate-300
              transition
              hover:bg-white/20
              hover:text-white
            "
            aria-label="Close"
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

      {/* =================================================
          BODY
      ================================================= */}

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-6 sm:p-8">

          {/* =================================================
              PROGRAM SUMMARY
          ================================================= */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* ID */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Record ID
              </p>

              <p className="mt-2 text-sm font-bold text-slate-900">
                #{viewingService.id}
              </p>
            </div>

            {/* Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Status
              </p>

              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                    viewingService.isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      viewingService.isActive
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                    }`}
                  />

                  {viewingService.isActive
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>

            {/* Created */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Created
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {viewingService.createdAt
                  ? new Date(
                      viewingService.createdAt
                    ).toLocaleString()
                  : "-"}
              </p>
            </div>

          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          {viewingService.description && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-950">
                  Description
                </h3>

                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-teal-600">
                  Overview
                </span>
              </div>

              <p className="text-sm leading-7 text-slate-600">
                {viewingService.description}
              </p>
            </div>
          )}

          {/* =================================================
              PROGRAM DATA
          ================================================= */}

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Program Information
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Complete funding information for this program.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">
                {Object.keys(
                  viewingService.data || {}
                ).length}{" "}
                Fields
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">

              {Object.entries(
                viewingService.data || {}
              ).map(([field, value]) => {
                const displayValue = isAmountField(field)
                  ? formatCanadianAmount(value)
                  : formatValue(value);

                const isUrl =
                  typeof value === "string" &&
                  /^(https?:\/\/|www\.)\S+$/i.test(
                    value.trim()
                  );

                const urlHref = isUrl
                  ? /^www\./i.test(value.trim())
                    ? `https://${value.trim()}`
                    : value.trim()
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
                    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${
                      isLongField
                        ? "md:col-span-2"
                        : ""
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        {field}
                      </p>

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-400">
                        FIELD
                      </span>
                    </div>

                    <div
                      className={`whitespace-pre-wrap text-sm leading-6 ${
                        displayValue === "-"
                          ? "text-slate-400"
                          : "text-slate-700"
                      }`}
                    >
                      {isUrl ? (
                        <a
                          href={urlHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 font-semibold text-teal-600 transition hover:bg-teal-100 hover:text-teal-800"
                        >
                          <span className="truncate">
                            {displayValue}
                          </span>

                          <svg
                            className="shrink-0"
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
                        </a>
                      ) : (
                        displayValue
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="flex shrink-0 items-center justify-end border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
        <button
          type="button"
          onClick={handleCloseView}
          className="
            rounded-xl
            bg-slate-900
            px-6
            py-3
            text-sm
            font-bold
            text-white
            transition
            hover:bg-teal-600
          "
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}



      </main>
  );
}